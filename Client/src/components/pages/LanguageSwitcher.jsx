// src/components/LanguageSwitcher.jsx
import { useTranslation } from "react-i18next";
import './LanguageSwitcher.css'

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const changeLang = (lng) => i18n.changeLanguage(lng);

  const languages = [
    { code: "en", label: "English",   flag: "us" },
    { code: "fr", label: "Français",  flag: "fr" },
    { code: "es", label: "Español",   flag: "es" },
    { code: "arabic", label: "arabic",   flag: "arabic" },
  ];

  const current = languages.find((l) => l.code === i18n.language) ?? languages[0];

  return (
    <div className="nav-item dropdown nav-item-animated classic-lang-dropdown" style={{ animationDelay: "0.6s" }}>
      <a
        className="nav-link dropdown-toggle d-flex align-items-center gap-2"
        href="#"
        role="button"
        data-bs-toggle="dropdown"
        aria-expanded="false"
      >
        <i className={`bi bi-flag-${current.flag} me-1`}></i>
        <span className="">{current.label}</span>
      </a>

      <ul className="dropdown-menu dropdown-menu-end classic-dropdown-menu">
        {languages.map((lang) => (
          <li key={lang.code}>
            <button
              className={`dropdown-item d-flex align-items-center gap-2 classic-dropdown-item ${
                i18n.language === lang.code ? "active" : ""
              }`}
              onClick={() => changeLang(lang.code)}
            >
              <i className={`bi bi-flag-${lang.flag} me-1`}></i>
              <span>{lang.label}</span>
              {i18n.language === lang.code && <i className="bi bi-check2 ms-auto"></i>}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}