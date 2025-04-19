# LUMOS

**L**ow-code **U**ser-centric **M**ulti-agent **O**rchestration **S**ystem: A platform to simplify building and managing multi-agent systems.

![LUMOS Logo](/lumos/frontend/public/LUMOS_logo.png)

## Overview

LUMOS is a comprehensive platform that enables users to design, build, and deploy multi-agent AI systems using a low-code approach. The system facilitates the creation of complex agent networks through a visual interface and structured definition language (LDL - LUMOS Definition Language).

Key features:
- Visual canvas-based agent orchestration
- Structured agent definition using LDL
- Export/import capabilities for agent systems
- Integration with AI providers
- Multi-agent communication management
- Testing and simulation tools

## System Requirements

### Backend Requirements
- Python 3.10+
- Docker & Docker Compose
- ngrok (for external API access)
- MySQL (for persistent storage)

### Frontend Requirements
- Node.js 16+
- npm/yarn

## Installation & Setup

### Backend Setup

1. Navigate to the backend directory:
```bash
cd lumos/backend
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Initialize the database:
```bash
python -m app.init_db
```

4. Install and configure ngrok (for external API access):
   - Download ngrok from https://ngrok.com/download
   - Set up with your auth token: `ngrok authtoken <YOUR_TOKEN>`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd lumos/frontend
```

2. Install dependencies:
```bash
npm install
```

## Running the Application

Run the following commands in separate terminals:

### Start the Backend FastAPI Server
```bash
cd lumos/backend
uvicorn app.main:app --reload
```

### Start the Proxy Server (for external API connections)
```bash
cd lumos/backend
python proxy.py
```

### Start the Frontend Development Server
```bash
cd lumos/frontend
npm run dev
```

The application will be available at http://localhost:5173

### Using Docker

You can also run the application using Docker:

```bash
docker-compose up
```

## System Architecture

LUMOS consists of three main components:

1. **Frontend**: React/TypeScript-based UI with a visual canvas for designing agent systems
2. **Backend API**: FastAPI-based server managing project data and agent interactions
3. **Proxy Service**: Flask-based proxy for routing external API calls to agent services

### Key Components:

- **Canvas Interface**: Visual workspace for designing agent systems
- **Element Palette**: Repository of agent, task, and tool templates
- **LDL Schema**: JSON schema defining the structure of multi-agent systems
- **Generator Service**: Converts visual designs to executable code
- **Project Service**: Manages saving, loading, and versioning of projects

## Code Structure

### Backend Structure
```
lumos/backend/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI application entry point
│   ├── init_db.py              # Database initialization
│   ├── schema.sql              # SQL schema definitions
│   ├── controllers/            # API route handlers
│   ├── models/                 # Data models and database interfaces
│   ├── schemas/                # Pydantic schemas for validation
│   ├── services/               # Business logic implementation
│   └── utils/                  # Helper utilities
├── tests/                      # Backend unit tests
├── proxy.py                    # API routing proxy
├── requirements.txt            # Python dependencies
└── ui_app/                     # Embedded UI application
```

### Frontend Structure
```
lumos/frontend/
├── src/
│   ├── App.tsx                 # Main application component
│   ├── components/             # React UI components
│   │   ├── Canvas.tsx          # Agent design canvas
│   │   ├── ElementPalette.tsx  # Component selector
│   │   └── ...                 # Other UI components
│   ├── controllers/            # Frontend controllers for business logic
│   ├── models/                 # Data models and interfaces
│   └── services/               # API services and utilities
└── public/                     # Static assets
```

## LUMOS Definition Language (LDL)

LUMOS uses a structured JSON schema (LDL) to define multi-agent systems. The schema includes:

- **Project metadata**: Name, version, description
- **Agents**: AI or deterministic entities with specific capabilities
- **Tasks**: Work items performed by agents
- **Tools**: External utilities that agents can access
- **Interactions**: Communication protocols between components

Refer to `LDLSchema.json` for the complete schema definition and `docs/LDLSyntax_v2.md` for detailed syntax information.

## Usage Guide

1. **Create a new project**:
   - Define project metadata
   - Select agent components from the palette
   - Connect agents with interactions

2. **Configure agents**:
   - Select agent types (AI, Deterministic, Hybrid)
   - Define capabilities and memory configurations
   - Set up model parameters

3. **Define interactions**:
   - Create communication paths between agents
   - Configure messaging protocols
   - Set up task dependencies

4. **Export/Import projects**:
   - Export designs as LDL-compatible JSON
   - Import existing designs
   - Share projects with other users

5. **Testing**:
   - Run simulations of agent interactions
   - Debug communication flows
   - Optimize agent configurations

## Testing

### Backend Tests

To run backend tests:

```bash
cd lumos/backend
pytest
```

Key test files:
- `test_export_and_save_controller.py`: Tests for project export functionality
- `test_generator_controller.py`: Tests for code generation
- `test_network_utils.py`: Tests for API communication utilities

To run all tests:
```bash
python -m unittest discover -v tests
```

### Frontend Tests

To run frontend tests:

```bash
cd lumos/frontend
npm run test
```

To test coverage by test:
```bash
npm run test:coverage
```

## API Documentation

The backend API documentation is available at http://localhost:8000/docs when the backend server is running.

## Contributors
- Prakhar Singhal
- Hemang Jain
- Divyansh Pandey
- Mohak Somani
- Sanchit Jalan

## License

[License information to be added]