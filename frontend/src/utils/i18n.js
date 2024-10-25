import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// the translations
// (tip move them in a JSON file and import them,
// or even better, manage them separated from your code: https://react.i18next.com/guides/multiple-translation-files)
const resources = {
  en: {
    translation: {
      GamesHead: "Games",
      TucanFly: "Tucan Fly",
      TucanDraw: "Tucan Draw",
      TucanTalk: "Tucan Talk",
      TucanTranslate: "Tucan Translate",
      LogOut: "Log Out",
      ChangeLanguage: "Cambiar Idioma",
      Numbers: "Numbers",
      Objects: "Objects",
      Speaking: "Speaking",
      Sentence: "Sentence",
      DailyQuest: "Daily Quest",
      ResetsIn: "Resets in...",
      ResettingSoon: "Resetting soon...",
      AiChat: "Ask Me Anything...",
      ProgressBar: "Level Progress"
    }
  },
  sp: {
    translation: {
      GamesHead: "Juegos",
      TucanFly: "Tucan Volar",
      TucanDraw: "Tucan Dibujar",
      TucanTalk: "Tucan Hablar",
      TucanTranslate: "Tucan Traducir",
      LogOut: "Cerrar Sesión",
      ChangeLanguage: "Change Language",
      Numbers: "Números",
      Objects: "Objetos",
      Speaking: "Hablar",
      Sentence: "Oración",
      DailyQuest: "Misión Diaria",
      ResetsIn: "Reinicia en",
      ResettingSoon: "Reiniciando pronto...",
      AiChat: "Pregúntame cualquier cosa...",
      ProgressBar: "Progresso de Nivel"
    }
  }
};

i18n
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    resources,
    lng: "en", // language to use, more information here: https://www.i18next.com/overview/configuration-options#languages-namespaces-resources
    // you can use the i18n.changeLanguage function to change the language manually: https://www.i18next.com/overview/api#changelanguage
    // if you're using a language detector, do not define the lng option

  });

  export default i18n;