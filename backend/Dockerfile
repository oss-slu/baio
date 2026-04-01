FROM python:3.12-slim
WORKDIR /app

# small OS utils + curl for healthchecks + build tools for hdbscan/Cython wheels
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl ca-certificates gcc g++ && rm -rf /var/lib/apt/lists/*

# prefer CPU-only torch wheels by default
ENV PIP_EXTRA_INDEX_URL=https://download.pytorch.org/whl/cpu

# project metadata first (for better Docker caching)
COPY pyproject.toml README.md /app/

# copy python packages needed for the editable install
COPY metaseq /app/metaseq
COPY prompting /app/prompting
COPY data_processing /app/data_processing
COPY binary_classifiers /app/binary_classifiers

# install the project and API deps
RUN pip install --upgrade pip && \
    pip install -e . && \
    pip install fastapi uvicorn[standard] pydantic

# copy API code
COPY backend/app /app/app

EXPOSE 8080
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]
