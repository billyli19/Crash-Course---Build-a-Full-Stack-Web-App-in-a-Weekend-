import { useEffect, useState } from "react";
import supabase from "./supabase";
import "./style.css";

const CATEGORIES = [
  { name: "technology", color: "#3b82f6" },
  { name: "science", color: "#16a34a" },
  { name: "finance", color: "#ef4444" },
  { name: "society", color: "#eab308" },
  { name: "entertainment", color: "#db2777" },
  { name: "health", color: "#14b8a6" },
  { name: "history", color: "#f97316" },
  { name: "news", color: "#8b5cf6" },
];

function Loader() {
  return <p className="message">Loading...</p>;
}

function Header({ showForm, setShowForm }) {
  return (
    <header className="header">
      <div className="logo">
        <img src="logo.png" alt="TIL Logo" />
        <h1>Today I Learned</h1>
      </div>
      <button className="btn btn-large btn-open" onClick={setShowForm}>
        {showForm ? "Close" : "Share a fact"}
      </button>
    </header>
  );
}

function isValidHttpUrl(string) {
  let url;

  try {
    url = new URL(string);
  } catch (_) {
    return false;
  }

  return url.protocol === "http:" || url.protocol === "https:";
}

function FactForm({ setFacts, setShowForm }) {
  const [text, setText] = useState("");
  const [source, setSource] = useState("");
  const [category, setCategory] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const textLength = text.length;

  async function handleSubmit(e) {
    // 1. Prevent browser from refreshing
    e.preventDefault();

    // 2. Validate form
    if (text && isValidHttpUrl(source) && category && textLength <= 200) {
      // 3. Create a new fact object to Supabase
      setIsUploading(true);
      const { data: newFact, error } = await supabase
        .from("fact")
        .insert([
          {
            text,
            source,
            category,
          },
        ])
        .select();
      setIsUploading(false);

      // 4. Add the new fact to the UI: add the fact to the facts array
      if (!error) setFacts((prevFacts) => [newFact[0], ...prevFacts]);
      else alert("An error occurred. Please try again later.");

      // 5. Reset the form
      setText("");
      setSource("");
      setCategory("");

      // 6. Close the form
      setShowForm(false);
    }
  }

  return (
    <form className="fact-form" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Share a fact with the world..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={isUploading}
      />
      <span>{200 - textLength}</span>
      <input
        type="text"
        placeholder="Trustworthy source..."
        value={source}
        onChange={(e) => setSource(e.target.value)}
        disabled={isUploading}
      />
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        disabled={isUploading}
      >
        <option value="">Choose category:</option>
        {CATEGORIES.map((category) => (
          <option key={category.name} value={category.name}>
            {category.name}
          </option>
        ))}
      </select>
      <button className="btn btn-large" disabled={isUploading}>
        Post
      </button>
    </form>
  );
}

function CategoryFilters({ setCurrentCategory }) {
  const categories = CATEGORIES;

  return (
    <aside>
      <ul>
        <li className="category">
          <button
            className="btn btn-all-categories"
            onClick={() => {
              setCurrentCategory("all");
            }}
          >
            All
          </button>
        </li>
        {categories.map((category) => (
          <Category
            key={category.name}
            category={category}
            setCurrentCategory={setCurrentCategory}
          />
        ))}
      </ul>
    </aside>
  );
}

function Category({ category, setCurrentCategory }) {
  return (
    <li className="category">
      <button
        className="btn btn-category"
        style={{ backgroundColor: category.color }}
        onClick={() => {
          setCurrentCategory(category.name);
        }}
      >
        {category.name}
      </button>
    </li>
  );
}

function FactList({ facts, setFacts }) {
  if (facts.length === 0) {
    return (
      <p className="message">
        No facts for this category found. Create the first one ✌️{" "}
      </p>
    );
  }

  return (
    <ul className="fact-list">
      {facts.map((fact) => (
        <Fact key={fact.id} fact={fact} setFacts={setFacts} />
      ))}
    </ul>
  );
}

function Fact({ fact, setFacts }) {
  const [isUpdating, setIsUploading] = useState(false);
  const isDisputed =
    fact.votesInteresting + fact.votesMindblowing < fact.votesFalse;

  async function handleVote(columnName) {
    setIsUploading(true);
    const { data: updatedFact, error } = await supabase
      .from("fact")
      .update({
        [columnName]: fact[columnName] + 1,
      })
      .eq("id", fact.id)
      .select();
    setIsUploading(false);

    if (!error)
      setFacts((facts) =>
        facts.map((f) => (f.id === fact.id ? updatedFact[0] : f))
      );
  }

  return (
    <li className="fact" key={fact.id}>
      <p>
        {isDisputed ? <span className="disputed">❗disputed</span> : null}
        {fact.text}{" "}
        <a
          className="source"
          href={fact.source}
          target="_blank"
          rel="noreferrer"
        >
          (Source)
        </a>
      </p>
      <span
        className="tag"
        style={{
          backgroundColor: CATEGORIES.find((cat) => cat.name === fact.category)
            .color,
        }}
      >
        {fact.category}
      </span>
      <div className="vote-buttons">
        <button
          onClick={() => handleVote("votesInteresting")}
          disabled={isUpdating}
        >
          👍{fact.votesInteresting}
        </button>
        <button
          onClick={() => handleVote("votesMindblowing")}
          disabled={isUpdating}
        >
          🤯{fact.votesMindblowing}
        </button>
        <button onClick={() => handleVote("votesFalse")} disabled={isUpdating}>
          ⛔️{fact.votesFalse}
        </button>
      </div>
    </li>
  );
}

export default function App() {
  const [showForm, setShowForm] = useState(false);
  const [facts, setFacts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentCategory, setCurrentCategory] = useState("all");

  useEffect(
    function () {
      async function fetchData() {
        setIsLoading(true);

        let query = supabase.from("fact").select("*");
        if (currentCategory !== "all") {
          query = query.eq("category", currentCategory);
        }

        const { data: facts, error } = await query
          .order("votesInteresting", { ascending: false })
          .limit(1000);

        if (!error) setFacts(facts);
        else alert("An error occurred. Please try again later.");
        setIsLoading(false);
      }
      fetchData();
    },
    [currentCategory]
  );

  function handleShowForm() {
    setShowForm(!showForm);
  }

  return (
    <>
      <Header showForm={showForm} setShowForm={handleShowForm} />
      {showForm ? (
        <FactForm setFacts={setFacts} setShowForm={setShowForm} />
      ) : null}

      <main className="main">
        <CategoryFilters setCurrentCategory={setCurrentCategory} />
        {isLoading ? (
          <Loader />
        ) : (
          <FactList facts={facts} setFacts={setFacts} />
        )}
      </main>
    </>
  );
}
