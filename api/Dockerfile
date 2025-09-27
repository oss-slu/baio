FROM python:3.11-slim
WORKDIR /app

# small OS utils + curl for healthchecks
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl ca-certificates && rm -rf /var/lib/apt/lists/*

# install the project (metaseq) via pyproject; then API deps
COPY pyproject.toml README.md /app/
COPY metaseq /app/metaseq
RUN pip install --upgrade pip && pip install -e . && \
    pip install fastapi uvicorn[standard] pydantic

# copy API code
COPY api /app/api

EXPOSE 8080
CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8080"]
