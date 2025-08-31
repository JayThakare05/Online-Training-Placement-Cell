from fastapi import FastAPI, UploadFile
import uvicorn

app = FastAPI()

@app.get("/")
def home():
    return {"msg": "ML Resume Scanner API Running 🚀"}

@app.post("/scan-resume/")
async def scan_resume(file: UploadFile):
    text = await file.read()
    # TODO: Add NLP model here
    return {"filename": file.filename, "extracted_text": text.decode("utf-8")}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
