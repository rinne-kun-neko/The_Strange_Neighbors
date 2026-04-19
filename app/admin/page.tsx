"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function Admin() {
  const [name, setName] = useState("");
  const [height, setHeight] = useState("");

  const handleSubmit = async () => {
    await supabase.from("characters").insert([{ name, height }]);
    alert("保存完了");
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>管理ページ</h1>

      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="名前"
      />
      <br />

      <input
        value={height}
        onChange={(e) => setHeight(e.target.value)}
        placeholder="身長"
      />
      <br />

      <button onClick={handleSubmit}>保存</button>
    </div>
  );
}