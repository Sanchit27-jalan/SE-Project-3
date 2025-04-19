#!/usr/bin/env python3
import mysql.connector
from mysql.connector import Error
import os
from dotenv import load_dotenv
import argparse

# Load environment variables
load_dotenv()

def get_db_connection(root_conn=False):
    """Get database connection with or without root privileges"""
    config = {
        'host': os.getenv('DB_HOST', 'localhost'),
        'user': 'root' if root_conn else os.getenv('DB_USER', 'lumos_user'),
        'password': os.getenv('DB_ROOT_PASSWORD', '') if root_conn else os.getenv('DB_PASSWORD', 'secure_password'),
        'auth_plugin': 'mysql_native_password',  # Changed from '12' to valid value
        'use_pure': True
    }
    if not root_conn:
        config['database'] = os.getenv('DB_NAME', 'lumos')
    return mysql.connector.connect(**config)

def create_database_and_user():
    """Create database and user if they don't exist"""
    conn = get_db_connection(root_conn=True)
    try:
        cursor = conn.cursor()
        
        # Create database
        db_name = os.getenv('DB_NAME', 'lumos')
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS {db_name}")
        
        # Create user and grant permissions
        db_user = os.getenv('DB_USER', 'lumos_user')
        db_password = os.getenv('DB_PASSWORD', 'secure_password')
        
        # Separate the CREATE USER and GRANT commands
        try:
            # Try to drop the user first (ignore errors if it doesn't exist)
            cursor.execute(f"DROP USER IF EXISTS '{db_user}'@'localhost'")
            
            # Create the user
            cursor.execute(f"CREATE USER '{db_user}'@'localhost' IDENTIFIED BY '{db_password}'")
            print(f"✅ User '{db_user}' created successfully")
        except Error as user_error:
            print(f"⚠️ Note about user creation: {str(user_error)}")
        
        # Grant privileges (will work even if user already exists)
        cursor.execute(f"GRANT ALL PRIVILEGES ON {db_name}.* TO '{db_user}'@'localhost'")
        cursor.execute("FLUSH PRIVILEGES")
        
        print(f"✅ Database '{db_name}' created and privileges granted")
        return True
        
    except Error as e:
        print(f"❌ Error in database setup: {str(e)}")
        return False
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

def execute_sql_file(file_path):
    """Execute SQL commands from file"""
    conn = None  # Initialize conn to None
    try:
        # Connect as root to execute schema file
        conn = get_db_connection(root_conn=True)
        cursor = conn.cursor()
        
        # Get database name to use it
        db_name = os.getenv('DB_NAME', 'lumos')
        cursor.execute(f"USE {db_name}")
        
        # Read and execute SQL file
        with open(file_path, 'r') as f:
            sql_content = f.read()
        
        # Remove CREATE DATABASE, CREATE USER, and similar privileged operations
        # This is a more comprehensive filter
        filtered_lines = []
        for line in sql_content.split('\n'):
            line_upper = line.strip().upper()
            if (not line_upper.startswith('CREATE DATABASE') and
                not line_upper.startswith('CREATE USER') and
                not line_upper.startswith('GRANT') and
                not line_upper.startswith('FLUSH PRIVILEGES')):
                filtered_lines.append(line)
                
        modified_sql = '\n'.join(filtered_lines)
        
        # Split commands by semicolon and execute each one
        for command in modified_sql.split(';'):
            command = command.strip()
            if command:
                try:
                    cursor.execute(command)
                except Error as cmd_error:
                    # Skip errors about already existing objects
                    if "already exists" in str(cmd_error):
                        print(f"Note: Skipping existing object creation: {str(cmd_error)}")
                    else:
                        raise cmd_error
                
        conn.commit()
        print(f"✅ Successfully executed {file_path}")
        return True
    except Error as e:
        print(f"❌ Error executing {file_path}: {str(e)}")
        return False
    finally:
        if conn is not None and conn.is_connected():
            cursor.close()
            conn.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Initialize Lumos database')
    parser.add_argument('--schema', help='Path to SQL schema file', default='schema.sql')
    args = parser.parse_args()
    
    print("🚀 Starting database initialization...")
    
    if create_database_and_user():
        if execute_sql_file(args.schema):
            print("🎉 Database setup completed successfully!")
        else:
            print("💥 Failed to initialize schema")
    else:
        print("💥 Failed to create database/user")