import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [selectedText, setSelectedText] = useState("");
  const [articleTitle, setArticleTitle] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [articles, setArticles] = useState<any[]>([]);
  const [conclusion, setConclusion] = useState("");
  const [confidence, setConfidence] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    chrome.tabs?.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(
          tabs[0].id,
          { action: "getTitle" },
          (response) => {
            if (response?.title) {
              setArticleTitle(response.title);
              // optional: store in chrome.storage.local if needed later
              chrome.storage.local.set({ articleTitle: response.title });
            }
          }
        );
      }
    });
  }, []);

  useEffect(() => {
    if (!articleTitle) return; // wait for title to be set

    chrome.storage?.local.get("selectedText", (result) => {
      if (result.selectedText) {
        const text = result.selectedText;
        setSelectedText(text);
        getQuery(text, articleTitle);
        runFullPipeline(text, articleTitle);
      }
    });
  }, [articleTitle]);

  const getQuery = async (text: string, title: string) => {
    try {
      const response = await fetch("http://localhost:8888/generate_query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, title })
      });

      const data = await response.json();
      const query = data.query || "";
      setSearchQuery(query);
    } catch (error) {
      console.error("Error generating query:", error);
    }
  };

  const runFullPipeline = async (claim: string, title: string) => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:8888/search_and_check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          claim, 
          title,
          current_url: window.location.href   
        })
      });

      const data = await response.json();
      setArticles(data.results || []);
      determineConclusion(data.results || []);
    } catch (error) {
      console.error("Error running full pipeline:", error);
    } finally {
      setLoading(false);
    }
  };

  const determineConclusion = (articles: any[]) => {
    const supportScores = articles.map((a) => a.fact_check.scores.supports);
    const contradictScores = articles.map((a) => a.fact_check.scores.contradicts);
    const unclearScores = articles.map((a) => a.fact_check.scores.unclear);

    const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / (arr.length || 1);

    const avgSupport = avg(supportScores);
    const avgContradict = avg(contradictScores);
    const avgUnclear = avg(unclearScores);

    if (avgSupport > avgContradict && avgSupport > avgUnclear) {
      setConclusion("Supports");
      setConfidence(avgSupport);
    } else if (avgContradict > avgSupport && avgContradict > avgUnclear) {
      setConclusion("Contradicts");
      setConfidence(avgContradict);
    } else {
      setConclusion("Unclear");
      setConfidence(avgUnclear);
    }
  };

  return (
    <div className="layout">
      <h2 className="header">Fact-Checker</h2>

      <div className="highlight-section">
        {selectedText && (
          <div className="statement-section">
            <p className="statement-title">{'\u{1f4a1}'} Statement Under Review</p>
            <p className="statement-body">{selectedText}</p>
          </div>
        )}

        {/* vvv FOR TESTING PURPOSES */}

        {searchQuery && (
          <p className="statement-query"><strong>Search Query:</strong> {searchQuery}</p>
        )}

        {articleTitle && (
          <p className="statement-query"><strong>Article Title:</strong> {articleTitle}</p>
        )}

        {/* ^^^ FOR TESTING PURPOSES */}

        {loading && (
          <div className="loading-indicator">
            <p>Fact-checking across trusted sources...</p>
            <div className="spinner"></div>
          </div>
        )}

        {conclusion && (
          <div className="conclusion-section">
            <p>
              Conclusion:{" "}
              <span className="conclusion" data-status={conclusion}>
                {conclusion}
              </span>{" "}
              {confidence !== null && <span>| {Math.round(confidence * 100)}% Confidence</span>}
            </p>
          </div>
        )}

        {articles.length > 0 && (
          <div className="article-section">
            <h3>Evidence</h3>
            <ol>
              {articles.map((article, index) => {
                const { relation, extractedQuote, scores } = article.fact_check;
                return (
                  <li key={index} className="article-item">
                    <div className="article-heading">
                      <a
                        className="article-title"
                        href={article.link}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {article.title}
                      </a>
                      <p className="article-conclusion" data-status={relation}>
                        {relation} — {Math.max(scores.supports, scores.contradicts, scores.unclear) * 100 | 0}%
                      </p>
                    </div>
                    <p className="article-quote">↪ "{extractedQuote}"</p>
                    {/* <ul className="score-list">
                      <li>Supports: {scores.supports}</li>
                      <li>Contradicts: {scores.contradicts}</li>
                      <li>Unclear: {scores.unclear}</li>
                    </ul> */}
                    <div className="divider"></div>
                  </li>
                );
              })}
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
