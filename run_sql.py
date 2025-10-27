#!/usr/bin/env python3
"""Execute arbitrary SQL statements against the local SQL Server container."""

import argparse
import os
import sys
from typing import Iterable, List, Sequence


def _require_pyodbc():
    try:
        import pymssql  # type: ignore
    except ModuleNotFoundError as exc:  # pragma: no cover - dependency check
        import subprocess
        import sys

        script_dir = os.path.dirname(os.path.abspath(__file__))
        requirements_file = os.path.join(script_dir, "requirements.txt")

        if os.path.exists(requirements_file):
            print("pymssql is required but not installed.")
            print(f"Installing dependencies from {requirements_file}...")

            try:
                subprocess.check_call([
                    sys.executable, "-m", "pip", "install", "-r", requirements_file
                ])
                print("Dependencies installed successfully. Please run the script again.")
                sys.exit(0)
            except subprocess.CalledProcessError as install_exc:
                message = (
                    f"Failed to install dependencies from {requirements_file}. "
                    "Please install manually with: pip install -r scripts/database/requirements.txt"
                )
                raise SystemExit(message) from install_exc
        else:
            message = (
                "pymssql is required to run this script. Install it with "
                "`pip install pymssql` or use the requirements file: "
                "`pip install -r scripts/database/requirements.txt`."
            )
            raise SystemExit(message) from exc
    except ImportError as exc:  # pragma: no cover - surfaced when FreeTDS is missing
        message = (
            "pymssql is installed but could not load the underlying FreeTDS libraries. "
            "Install FreeTDS (e.g. `brew install freetds` on macOS) "
            "and then rerun the script."
        )
        raise SystemExit(message) from exc
    return pymssql


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Run a SQL query against the SQL Server instance defined in docker-compose.yml. "
            "Provide the SQL inline, via a file, or from stdin."
        )
    )
    parser.add_argument(
        "sql",
        nargs="?",
        help="SQL to execute. Use '-' to read from stdin if no --file is provided.",
    )
    parser.add_argument(
        "-f",
        "--file",
        type=str,
        help="Path to a file containing the SQL to execute.",
    )
    parser.add_argument(
        "--server",
        default=os.getenv("SQLSERVER_HOST", "127.0.0.1"),
        help="SQL Server host name or IP address.",
    )
    parser.add_argument(
        "--port",
        type=int,
        default=int(os.getenv("SQLSERVER_PORT", "1433")),
        help="SQL Server port.",
    )
    parser.add_argument(
        "--database",
        default=os.getenv("SQLSERVER_DATABASE", "collection"),
        help="Database name to connect to.",
    )
    parser.add_argument(
        "--user",
        default=os.getenv("SQLSERVER_USER", "sa"),
        help="Username for authentication.",
    )
    parser.add_argument(
        "--password",
        default=os.getenv("SQLSERVER_PASSWORD", "YourNewStrong!Passw0rd"),
        help="Password for authentication.",
    )
    return parser.parse_args()


def resolve_sql(args: argparse.Namespace) -> str:
    if args.file:
        try:
            with open(args.file, "r", encoding="utf-8") as handle:
                return handle.read().strip()
        except OSError as exc:
            raise SystemExit(f"Unable to read SQL from {args.file}: {exc}")

    if args.sql and args.sql != "-":
        return args.sql

    try:
        return sys.stdin.read().strip()
    except KeyboardInterrupt as exc:  # pragma: no cover - interactive use
        raise SystemExit("SQL input cancelled.") from exc


def format_table(headers: Sequence[str], rows: Sequence[Sequence[object]]) -> List[str]:
    str_rows: List[List[str]] = [
        ["" if value is None else str(value) for value in row] for row in rows
    ]
    widths = [len(col) for col in headers]

    for str_row in str_rows:
        for idx, value in enumerate(str_row):
            widths[idx] = max(widths[idx], len(value))

    def _format_line(items: Iterable[str]) -> str:
        return " | ".join(value.ljust(widths[idx]) for idx, value in enumerate(items))

    separator = "-+-".join("-" * width for width in widths)
    output_lines = [_format_line(headers), separator]
    output_lines.extend(_format_line(row) for row in str_rows)
    return output_lines


def main() -> None:
    args = parse_args()
    sql_text = resolve_sql(args)
    if not sql_text:
        raise SystemExit("No SQL provided. Supply it as an argument, file, or via stdin.")

    pymssql = _require_pyodbc()

    try:
        connection = pymssql.connect(
            server=args.server,
            port=args.port,
            user=args.user,
            password=args.password,
            database=args.database,
        )
    except pymssql.Error as exc:  # pragma: no cover - connection failures are runtime issues
        raise SystemExit(f"Failed to connect to SQL Server: {exc}")

    with connection:
        cursor = connection.cursor()
        try:
            cursor.execute(sql_text)
        except pymssql.Error as exc:
            raise SystemExit(f"Failed to execute SQL: {exc}")

        result_index = 1
        has_output = False

        while True:
            columns = [column[0] for column in cursor.description] if cursor.description else []
            rows = cursor.fetchall() if columns else []

            if columns:
                has_output = True
                if result_index > 1:
                    print()  # Blank line between result sets
                print(f"Result set {result_index}:")
                for line in format_table(columns, rows):
                    print(line)
                print(f"({len(rows)} row{'s' if len(rows) != 1 else ''})")
            else:
                rowcount = cursor.rowcount
                if rowcount != -1:
                    has_output = True
                    if result_index > 1:
                        print()
                    print(f"Statement {result_index} affected {rowcount} row(s).")

            result_index += 1
            if not cursor.nextset():
                break

        if not has_output:
            print("SQL executed successfully with no results to display.")


if __name__ == "__main__":
    main()
