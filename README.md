# 🎓 AI-Powered Student Academic & Career Assistant

An AI-powered platform designed to help students manage their academic activities, understand study materials, and improve their learning experience.

## 🚀 Project Overview

The AI Study Assistant is a web-based application that combines Artificial Intelligence with academic productivity tools to make learning smarter and more efficient.

## ✨ Key Features

- **AI Notes Summarization:** Generate concise summaries from study materials.
- **AI Question Answering:** Ask questions about academic topics.
- **Quiz Generation:** Generate quizzes to test your understanding.
- **Subject Management:** Organize academic subjects.
- **PDF Upload:** Upload study materials for AI-powered processing.
- **User Authentication:** Secure registration and login.

## 🛠️ Technologies Used

| Component | Technology |
|---|---|
| Frontend | React, Tailwind CSS |
| Backend | Python, FastAPI |
| Database | SQLite |
| AI Integration | Groq API |
| Authentication | JWT |
| PDF Processing | PyMuPDF |

## 📁 Project Structure

```text
AI-Study-Assistant/
├── backend/
│   ├── app/
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
├── docs/
├── .gitignore
└── README.md
```

## ⚙️ Installation and Setup

### 1. Clone the repository

```bash
git clone https://github.com/krupaelon/AI-Study-Assistant.git
cd AI-Study-Assistant
```

### 2. Backend Setup

```bash
cd backend
python -m venv venv
```

Activate the environment on Windows:

```bash
venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Configure your environment variables in a local `.env` file. Add your own Groq API key and other required configuration values.

Start the backend using your project's FastAPI entry point.

### 3. Frontend Setup

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

### 4. Access the application

Open the local frontend URL displayed by Vite in your terminal.

## 🔐 Security

- API keys and secrets must remain in local environment files.
- Never commit `.env` files or private credentials.
- Do not upload private student documents or database files.

## 👩‍💻 Developer

**Krupa K V**

Computer Science and Engineering Student

GitHub: [@krupaelon](https://github.com/krupaelon)

## 📌 Project Status

Final-year academic project — under development.

---

*Making student learning smarter with Artificial Intelligence.*