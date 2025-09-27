FROM python:3.11-slim
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl ca-certificates && rm -rf /var/lib/apt/lists/*

# install project (if Streamlit imports metaseq later)
COPY pyproject.toml README.md /app/
COPY metaseq /app/metaseq
RUN pip install --upgrade pip && pip install -e . && \
    pip install streamlit requests

# copy Streamlit app
COPY app /app/app

EXPOSE 8501
CMD ["streamlit", "run", "app/streamlit_app.py", "--server.port=8501", "--server.address=0.0.0.0"]
