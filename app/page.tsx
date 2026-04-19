"use client";

import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function Home() {
  const [name, setName] = useState("");
  const [height, setHeight] = useState("");
  const [hp, setHp] = useState("");
  const [dialogue, setDialogue] = useState("");

  const handleSubmit = async () => {
    // ① characters
    const { data: char } = await supabase
      .from("characters")
      .insert([{ name, height }])
      .select()
      .single();

    if (!char) return alert("キャラ保存失敗");

    // ② stats
    await supabase.from("stats").insert([
      {
        character_id: char.id,
        hp: Number(hp),
      },
    ]);

    // ③ dialogues
    await supabase.from("dialogues").insert([
      {
        character_id: char.id,
        text: dialogue,
      },
    ]);

    alert("保存完了");

    // リセット
    setName("");
    setHeight("");
    setHp("");
    setDialogue("");
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>キャラ入力</h1>

      <input
        placeholder="名前"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <br />

      <input
        placeholder="身長"
        value={height}
        onChange={(e) => setHeight(e.target.value)}
      />
      <br />

      <input
        placeholder="HP"
        value={hp}
        onChange={(e) => setHp(e.target.value)}
      />
      <br />

      <input
        placeholder="セリフ"
        value={dialogue}
        onChange={(e) => setDialogue(e.target.value)}
      />
      <br />

      <button onClick={handleSubmit}>保存</button>
    </div>
  );
}
