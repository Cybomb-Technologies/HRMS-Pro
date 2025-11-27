import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

const EditorPage = () => {
  const { id } = useParams();
  const [editorConfig, setEditorConfig] = useState(null);
  const [dsScriptEl, setDsScriptEl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    const token = localStorage.getItem("hrms_token");
    if (!token) {
      setError("Authentication Error: Please login again");
      setLoading(false);
      return;
    }

    setLoading(true);
    axios
      .get(`http://localhost:5000/api/editor/${id}/config`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then((res) => {
        setEditorConfig(res.data);
        setError(null);
      })
      .catch((err) => {
        console.error("CONFIG LOAD ERROR:", err?.response?.data || err.message || err);
        setError("Failed to load editor configuration");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  useEffect(() => {
    if (!editorConfig) return;

    // remove previous script if exists
    if (dsScriptEl) {
      dsScriptEl.remove();
      setDsScriptEl(null);
    }

    const script = document.createElement("script");
    script.src = editorConfig.documentServerApiUrl;
    script.async = true;
    script.onload = () => {
      try {
        // config object and token from backend
        const cfg = editorConfig.config;
        const token = editorConfig.token;

        new window.DocsAPI.DocEditor("editor", {
          height: "100%",
          width: "100%",
          type: cfg.type,
          documentType: cfg.documentType,
          document: cfg.document,
          editorConfig: cfg.editorConfig,
          token: token
        });
      } catch (err) {
        console.error("Failed to initialize DocsAPI.DocEditor:", err);
        setError("Failed to initialize editor");
      }
    };
    script.onerror = (e) => {
      console.error("Failed to load DS api.js from", editorConfig.documentServerApiUrl, e);
      setError("Failed to load editor script");
    };

    document.body.appendChild(script);
    setDsScriptEl(script);

    // cleanup on unmount
    return () => {
      if (script) script.remove();
    };
  }, [editorConfig]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading editor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">❌</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Editor Error</h3>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      {/* small overlay brand */}
      <div
        style={{
          position: "absolute",
          top: "6px",
          left: "10px",
          backgroundColor: "#1F1F1F",
          color: "#F5F5F5",
          fontSize: "13px",
          padding: "5px 12px",
          borderRadius: "6px",
          fontWeight: 600,
          fontFamily: "Segoe UI, sans-serif",
          zIndex: 9999,
          pointerEvents: "none",
          borderRight: "2px solid #555",
        }}
      >
        HR Letters
      </div>

      <div id="editor" style={{ width: "100%", height: "100%" }} />
    </div>
  );
};

export default EditorPage;