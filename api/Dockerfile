FROM python:3.12-slim
WORKDIR /app

# small OS utils + curl for healthchecks
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl ca-certificates && rm -rf /var/lib/apt/lists/*

# prefer CPU-only torch wheels by default
ENV PIP_EXTRA_INDEX_URL=https://download.pytorch.org/whl/cpu

# project metadata first (for better Docker caching)
COPY pyproject.toml README.md /app/

# copy python packages needed for the editable install
COPY metaseq /app/metaseq
COPY prompting /app/prompting
COPY data_processing /app/data_processing

# install the project and API deps
RUN pip install --upgrade pip && \
    pip install -e . && \
    pip install fastapi uvicorn[standard] pydantic

# copy API code
COPY api /app/api

EXPOSE 8080
CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8080"]
