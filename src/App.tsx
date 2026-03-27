import { useEffect, useState, useRef } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import Quill from "quill";
import "quill/dist/quill.snow.css";

type Article = {
  id: number;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
};

function App() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const editorRef = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    axios
      .get<Article[]>("http://127.0.0.1:8000/api/articles")
      .then((res) => setArticles(res.data))
      .catch((err) => console.error(err));
  }, []);

  const quillRef = useRef<Quill | null>(null);

  useEffect(() => {
    if (editorRef.current && !quillRef.current) {
      const quill = new Quill(editorRef.current, {
        theme: "snow",
        modules: {
          toolbar: [
            ["bold", "italic"],
            [{ list: "ordered" }, { list: "bullet" }],
          ],
        },
      });

      quill.on("text-change", () => {
        setContent(quill.root.innerHTML);
        setError("");
      });

      quillRef.current = quill; // prevent re-init
    }
  }, []);

  const createArticle = async () => {
    const isContentEmpty =
      !content ||
      content === "<p><br></p>" ||
      content.replace(/<(.|\n)*?>/g, "").trim() === "";

    if (!title.trim() || isContentEmpty) {
      setError("Title and content are required");
      return;
    }

    try {
      await axios.post("http://127.0.0.1:8000/api/articles", {
        title,
        content,
      });

      setTitle("");
      setContent("");

      if (quillRef.current) {
        quillRef.current.setText(""); // clears editor UI
      }

      const res = await axios.get<Article[]>(
        "http://127.0.0.1:8000/api/articles",
      );
      setArticles(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const deleteArticle = async (id: number) => {
    try {
      await axios.delete(`http://127.0.0.1:8000/api/articles/${id}`);

      // refresh list
      setArticles((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="container mt-5">
      {error && <div className="alert alert-danger">{error}</div>}
      <h1 className="text-center mb-5 fw-bold">📰 Latest Articles</h1>

      <div className="card mb-4 p-3 shadow">
        <h4>Create Article</h4>

        <input
          className="form-control mb-2"
          placeholder="Title"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setError("");
          }}
        />

        <div ref={editorRef} className="mb-3" />

        <button className="btn btn-primary" onClick={createArticle}>
          Add Article
        </button>
      </div>

      {articles.map((article) => (
        <div className="card mb-4 shadow-lg border-0 p-4" key={article.id}>
          <div className="card-body">
            <h3 className="card-title">{article.title}</h3>

            <div
              className="card-text"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />
          </div>
          <button
            className="btn btn-danger my-3"
            onClick={() => deleteArticle(article.id)}
          >
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}

export default App;
