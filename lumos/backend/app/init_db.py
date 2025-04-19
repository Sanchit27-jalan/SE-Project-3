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
        'password': os.getenv('DB_ROOT_PASSWORD') if root_conn else os.getenv('DB_PASSWORD'),
        'auth_plugin': 'mysql_native_password'
    }
    if not root_conn:
        config['database'] = os.getenv('DB_NAME', 'lumos')
    return mysql.connector.connect(**config)

def create_database_and_user():
    """Create database and user if they don't exist"""
    try:
        conn = get_db_connection(root_conn=True)
        cursor = conn.cursor()
        
        # Create database
        db_name = os.getenv('DB_NAME', 'lumos')
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS {db_name}")
        
        # Create user
        db_user = os.getenv('DB_USER', 'lumos_user')
        db_password = os.getenv('DB_PASSWORD', 'secure_password')
        cursor.execute(f"""
            CREATE USER IF NOT EXISTS '{db_user}'@'%' IDENTIFIED BY '{db_password}'
        """)
        
        # Grant privileges
        cursor.execute(f"""
            GRANT ALL PRIVILEGES ON {db_name}.* TO '{db_user}'@'%'
        """)
        cursor.execute("FLUSH PRIVILEGES")
        
        print(f"✅ Database '{db_name}' and user '{db_user}' created successfully")
        return True
        
    except Error as e:
        print(f"❌ Error creating database/user: {e}")
        return False
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

def execute_sql_file(filename):
    """Execute SQL commands from a file"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        with open(filename, 'r') as file:
            sql_commands = file.read().split(';')
            
            for command in sql_commands:
                if command.strip():
                    cursor.execute(command)
            
        conn.commit()
        print(f"✅ Schema initialized from {filename}")
        return True
        
    except Error as e:
        print(f"❌ Error executing {filename}: {e}")
        return False
    finally:
        if conn.is_connected():
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