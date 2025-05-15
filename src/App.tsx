import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [selectedText, setSelectedText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [relation, setRelation] = useState("");
  const [extractedQuote, setExtractedQuote] = useState("");
  const [scores, setScores] = useState<{ supports: number; contradicts: number; unclear: number } | null>(null);
  const [articles, setArticles] = useState<any[]>([]);
  
  useEffect(() => {
    chrome.storage.local.get("selectedText", (result) => {
      console.log(result.selectedText);
      if (result.selectedText) {
        const text = result.selectedText;
        setSelectedText(text);
        getQuery(text);  // call notebook
        getConclusion(text); // call notebook
        runFullPipeline(text); // fetch articles + fact-checking
      }
    });
  }, []);


  const getQuery = async (text: string) => {
    try {
      const response = await fetch("http://localhost:8888/generate_query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ text })
      });
  
      const data = await response.json();
      const query = data.query || "";
      setSearchQuery(query);
      console.log("Generated Query:", query);
    } catch (error) {
      console.error("Error generating query:", error);
    }
  };
  

  const getConclusion = async (text: string) => {
    try {
      const response = await fetch("http://localhost:8888/get_conclusion", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ quote: text })
      });

      const data = await response.json();

      setRelation(data.relation || "unknown");
      setExtractedQuote(data.extractedQuote || "");
      setScores(data.scores || null);
    } catch (error) {
      console.error("Error fetching conclusion:", error);
      setRelation("error");
    }
  };

  const runFullPipeline = async (claim: string) => {
    try {
      const response = await fetch("http://localhost:8888/search_and_check", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ claim })
      });

      const data = await response.json();
      console.log("Full pipeline response:", data);
      setArticles(data.results || []);
    } catch (error) {
      console.error("Error running full pipeline:", error);
    }
  };


  return (
    <>
      {/*<div>
        <a href="https://vitejs.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div> */}
      <h1>Fact-Checking</h1>
      <button onClick={() => { }}>
        Start Read
      </button>
      {selectedText && <p>{selectedText}</p>}
      {searchQuery && <p>Search Query: {searchQuery}</p>}
      {/* <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p> */}

      {relation && <p><strong>Conclusion:</strong> {relation}</p>}
      {extractedQuote && <p><strong>Extracted Sentence:</strong> “{extractedQuote}”</p>}
      {scores && (
        <div>
          <strong>Probabilities:</strong>
          <ul>
            <li>Supports: {scores.supports}</li>
            <li>Contradicts: {scores.contradicts}</li>
            <li>Unclear: {scores.unclear}</li>
          </ul>
        </div> )}

       {articles.length > 0 && (
        <div>
          <h3>Sources:</h3>
          <ul>
            {articles.map((article, index) => (
              <li key={index}>
                <a href={article.link} target="_blank" rel="noopener noreferrer">{article.title}</a>
                <p><strong>Conclusion:</strong> {article.fact_check.relation}</p>
                <p><strong>Quote:</strong> {article.fact_check.extractedQuote}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

export default App;
