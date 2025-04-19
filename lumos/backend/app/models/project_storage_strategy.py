
from abc import ABC, abstractmethod

class ProjectStorageStrategy(ABC):
    @abstractmethod
    def save_project(self, project_data):
        pass

    @abstractmethod
    def create_project(self, project_data):
        pass
