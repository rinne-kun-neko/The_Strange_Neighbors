"use client";

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

export default function Home() {
  const [user, setUser] = useState<any>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [name, setName] = useState("");
  const [height, setHeight] = useState("");
  const [hp, setHp] = useState("");
  const [dialogue, setDialogue] = useState("");

  // ログイン状態チェック
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });
  }, []);

  // ログイン
  const login = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) return alert("ログイン失敗");

    location.reload();
  };

  // ログアウト
  const logout = async () => {
    await supabase.auth.signOut();
    location.reload();
  };

  // 保存
  const handleSubmit = async () => {
    if (!user) return alert("ログインしてね");

    const { data: char } = await supabase
      .from("characters")
      .insert([{ name, height }])
      .select()
      .single();

    if (!char) return alert("失敗");

    await supabase.from("stats").insert([
      { character_id: char.id, hp: Number(hp) },
    ]);

    await supabase.from("dialogues").insert([
      { character_id: char.id, text: dialogue },
    ]);

    alert("保存完了");
  };

  // 未ログイン画面
  if (!user) {
    return (
      <div style={{ padding: 20 }}>
        <h1>ログイン</h1>

        <input
          placeholder="メール"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <br />

        <input
          type="password"
          placeholder="パスワード"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <br />

        <button onClick={login}>ログイン</button>
      </div>
    );
  }

  // ログイン後画面
  return (
    <div style={{ padding: 20 }}>
      <h1>キャラ入力</h1>

      <button onClick={logout}>ログアウト</button>
      <br /><br />

      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="名前" /><br />
      <input value={height} onChange={(e) => setHeight(e.target.value)} placeholder="身長" /><br />
      <input value={hp} onChange={(e) => setHp(e.target.value)} placeholder="HP" /><br />
      <input value={dialogue} onChange={(e) => setDialogue(e.target.value)} placeholder="セリフ" /><br />

      <button onClick={handleSubmit}>保存</button>
    </div>
  );
}