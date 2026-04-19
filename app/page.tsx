"use client"; // useStateを使う場合

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

export default function Page() {
  const [characters, setCharacters] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  useEffect(() => {
    async function getData() {
      const { data, error } = await supabase.from("characters").select("*");
      if (error) console.log(error);
      else setCharacters(data || []);
    }
    getData();
  }, []);

  const selectedCharacter = characters.find(c => c.id === selectedId) || characters[0];

  return (
    <main style={{ padding: 20 }}>
      <h1>youこんにちは、隣人は変人！</h1>

      <ul>
        {characters.map(c => (
          <li key={c.id}>
            <a href={`/?id=${c.id}`} onClick={(e) => { e.preventDefault(); setSelectedId(c.id); }}>
              {c.name}
            </a>
          </li>
        ))}
      </ul>

      {selectedCharacter && (
        <div style={{ marginTop: 20, border: "1px solid #ccc", padding: 12, borderRadius: 8 }}>
          <h2>{selectedCharacter.name}</h2>
          <p>身長：{selectedCharacter.height}</p>
          <p>誕生日：{selectedCharacter.birthday}</p>
          <p>性格：{selectedCharacter.personality}</p>
          {selectedCharacter.image_url && <img src={selectedCharacter.image_url} alt={selectedCharacter.name} style={{ width: 150, marginTop: 10 }} />}
        </div>
      )}
    </main>
  );
}
