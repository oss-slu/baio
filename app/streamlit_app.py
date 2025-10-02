import os
import requests
import streamlit as st


API_URL_INTERNAL = os.getenv("API_URL_INTERNAL", "http://api:8080")

NEXT_PUBLIC_API_URL = os.getenv("NEXT_PUBLIC_API_URL", "http://localhost:8080")

st.title("BAIO — Dockerized skeleton ✅")

uploaded = st.file_uploader("Upload (demo)")
if uploaded and st.button("Run Analysis"):
    try:
        r = requests.post(
            f"{API_URL_INTERNAL}/run", json={"input_path": uploaded.name}, timeout=30
        )
        r.raise_for_status()
        st.write("API says:", r.json())
    except requests.RequestException as e:
        st.error(f"Failed to reach API at {API_URL_INTERNAL}: {e}")

st.caption(f"API health (from your browser): {NEXT_PUBLIC_API_URL}/health")
