from fastapi import FastAPI, Request
from app.controllers.export_controller import router as export_router
from app.controllers.generator_controller import GeneratorController
# from app.controllers.save_controller import router as save_router
from fastapi.middleware.cors import CORSMiddleware
from fastapi.templating import Jinja2Templates
from pathlib import Path
import time
from app.utils.metrics_utils import record_latency, get_metrics

# set up Jinja2 templates directory
templates = Jinja2Templates(directory=str(Path(__file__).parent / "templates"))
    

app = FastAPI(title="Lumos Backend", version="1.0.0")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # frontend's URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# middleware to record latency
@app.middleware("http")
async def add_metrics_middleware(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    duration = time.time() - start
    record_latency(duration)
    response.headers["X-Process-Time"] = str(duration)
    return response

app.include_router(export_router, prefix="/api")

@app.get("/")
async def root():
    return {"message": "Lumos Backend is running"}

@app.get("/api/heartbeat")
async def heartbeat():
    return {"status": "OK"}

generator_controller = GeneratorController()
app.include_router(generator_controller.router, tags=["Generators"])

# metrics endpoint with dashboard
@app.get("/metrics")
async def metrics_dashboard(request: Request):
    metrics = get_metrics()
    return templates.TemplateResponse("metrics.html", {"request": request, "metrics": metrics})

@app.get("/metrics/data")
async def metrics_data():
    return get_metrics()