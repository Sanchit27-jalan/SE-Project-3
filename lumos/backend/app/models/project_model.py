from .database import Database
import json  # Add this import
import mysql.connector
from mysql.connector import Error
from .sql_storage_strategy import SQLProjectStorage

class ProjectModel:
    def __init__(self,strategy=SQLProjectStorage()):
        self.db = Database()
        self.strategy = strategy

    def create_project(self, project_data):
        return self.strategy.create_project(project_data)
       
    def save_project(self, project_data):
        return self.strategy.save_project(project_data)