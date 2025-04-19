# hello.py
from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def say_hi():
    return {"message": "hi"}

