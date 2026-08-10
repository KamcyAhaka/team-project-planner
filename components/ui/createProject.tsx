'use client';
import { useState } from 'react';

export default function CreateProjectForm() {
  const [form, setForm] = useState({
    title: '',
    description: '',
    deadline: '',
    members: '',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        members: form.members.split(','),
        creatorId: 'currentUserId', // replace with auth context
      }),
    });
    const data = await res.json();
    console.log('Project created:', data);
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        placeholder="Title"
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
      />
      <textarea
        placeholder="Description"
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
      />
      <input
        type="date"
        value={form.deadline}
        onChange={(e) => setForm({ ...form, deadline: e.target.value })}
      />
      <input
        placeholder="Members (comma-separated)"
        value={form.members}
        onChange={(e) => setForm({ ...form, members: e.target.value })}
      />
      <button type="submit">Create Project</button>
    </form>
  );
}
