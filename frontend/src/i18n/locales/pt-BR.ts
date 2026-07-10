export default {
  nav: {
    courses: 'Cursos',
    newCourse: '+ Novo curso',
    theme: {
      light: 'Mudar para modo claro',
      dark: 'Mudar para modo escuro',
    },
  },

  home: {
    title: 'Seus cursos',
    subtitle: 'Continue de onde parou ou comece algo novo.',
    newCourse: '+ Novo curso',
    openCourse: 'Abrir curso',
    empty: {
      message: 'Nenhum curso ainda.',
      cta: 'Criar seu primeiro curso',
    },
    error: 'Falha ao carregar os cursos. O backend está rodando?',
    status: {
      ready: 'Pronto',
      building: 'Criando',
      pending: 'Pendente',
    },
  },

  createCourse: {
    title: 'Criar um novo curso',
    subtitle: 'Descreva o que você quer aprender e a IA vai montar um currículo personalizado para você.',
    cardTitle: 'O que você quer aprender?',
    cardDescription: 'Seja específico — ex: "Criar APIs REST com FastAPI e PostgreSQL" ou "Aprender React do zero".',
    label: 'Objetivo de aprendizado',
    placeholder: 'Quero aprender…',
    languageLabel: 'Idioma do curso',
    languageDescription: 'Aulas e quizzes serão gerados neste idioma.',
    languages: {
      en: 'English',
      'pt-BR': 'Português (Brasil)',
    },
    submit: 'Criar curso',
    loading: {
      title: 'Criando seu curso…',
      subtitle: 'Nossa IA está planejando, pesquisando e estruturando o currículo. Isso leva de 30 a 120 segundos.',
    },
    error: 'Algo deu errado.',
  },

  course: {
    overview: 'Visão geral',
    progress: 'Progresso',
    estimatedTime: 'Tempo estimado',
    language: 'Idioma',
    modules: 'Módulos',
    subtopics: 'Subtópicos',
    module: 'Módulo',
    completion: 'Conclusão',
    overallProgress: 'Progresso geral',
    completedCount: '{{completed}} de {{total}} subtópicos concluídos',
    topicsToReview: 'Tópicos para revisar',
    recommendation: 'Recomendação',
    noProgress: 'Conclua seu primeiro quiz para ver os dados de progresso.',
    finalTest: 'Teste final',
    notFound: 'Este curso não pôde ser carregado.',
    delete: 'Excluir curso',
    deleteShort: 'Excluir',
    deleteConfirm: 'Excluir este curso e todo o progresso?',
    deleting: 'Excluindo…',
    deleteError: 'Não foi possível excluir o curso.',
  },

  sidebar: {
    curriculum: 'Currículo',
    lesson: 'Aula',
    quiz: 'Quiz',
    finalTest: 'Teste final',
  },

  lesson: {
    loading: {
      title: 'Carregando aula…',
      subtitle: 'Se for a primeira vez, a IA está gerando o conteúdo. Isso pode levar um minuto.',
    },
    error: {
      locked: 'Subtópico bloqueado',
      lockedDesc: 'Conclua o quiz do subtópico anterior para desbloquear esta aula.',
      generic: 'Não foi possível carregar a aula',
    },
    sections: {
      introduction: 'Introdução',
      explanation: 'Explicação',
    },
    takeQuiz: 'Fazer quiz',
    streaming: 'Escrevendo sua aula…',
  },

  quiz: {
    loading: {
      title: 'Carregando quiz…',
      subtitle: 'Se for a primeira vez, a IA está gerando as perguntas. Isso pode levar um minuto.',
    },
    error: {
      locked: 'Subtópico bloqueado',
      lockedDesc: 'Conclua o subtópico anterior para desbloquear este quiz.',
      generic: 'Não foi possível carregar o quiz',
    },
    questions: '{{count}} perguntas',
    passed: 'Quiz aprovado!',
    notPassed: 'Quiz não aprovado',
    passedBadge: 'Aprovado',
    tryAgain: 'Tentar novamente',
    nextUnlocked: 'Próximo subtópico desbloqueado!',
    weakTopics: 'Tópicos para revisar:',
    reviewAnswers: 'Revise suas respostas:',
    retake: 'Refazer quiz',
    backToCourse: 'Voltar ao curso',
    submit: 'Enviar respostas',
    submissionError: 'Erro no envio',
    question: 'P{{num}}.',
  },

  finalTest: {
    title: 'Teste final',
    loading: {
      title: 'Preparando teste final…',
      subtitle: 'A IA está gerando perguntas focadas nos seus pontos fracos. Isso pode levar um minuto.',
    },
    error: {
      generic: 'Não foi possível carregar o teste final',
    },
    questions: '{{count}} perguntas',
    mastery: {
      review: 'Precisa revisar',
      pass: 'Aprovado',
      mastered: 'Dominado!',
    },
    areasToImprove: 'Áreas para melhorar:',
    retake: 'Refazer teste',
    backToCourse: 'Voltar ao curso',
    submit: 'Enviar teste final',
    submissionError: 'Erro no envio',
  },

  agents: {
    working: 'Construindo com IA…',
    cachingNote: 'A IA está gerando este conteúdo pela primeira vez. Será armazenado em cache para visitas futuras.',
    'learning-planner': 'Planejando trilha de aprendizado',
    'curriculum-researcher': 'Pesquisando currículo',
    'course-builder': 'Construindo estrutura do curso',
    'content-generator': 'Escrevendo sua aula…',
    'quiz-generator': 'Escrevendo as perguntas…',
    validator: 'Revisando o conteúdo…',
  },

  common: {
    error: 'Erro',
    loading: 'Carregando…',
    cancel: 'Cancelar',
    backToCourse: 'Voltar ao curso',
  },
} as const
