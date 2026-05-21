// stream-config.js - Configuración de streams
const STREAMS = {
    youtube: {
        channelId: 'UCxxxxxxxxxxxx',  // ID de tu canal
        apiKey: 'TU_API_KEY_AQUI',     // API Key de YouTube (opcional)
        liveUrl: 'https://www.youtube.com/@SibaritaSC/live'
    },
    facebook: {
        pageId: 'sibaritasc',
        liveUrl: 'https://www.facebook.com/sibaritasc/live'
    },
    tiktok: {
        username: '@sibaritasc',
        profileUrl: 'https://www.tiktok.com/@sibaritasc'
    }
};

// Función para obtener el stream activo según el partido
function getStreamForMatch(matchId) {
    const match = MATCHES.find(m => m.id === matchId);
    if (!match) return STREAMS.youtube.liveUrl;
    
    // Puedes personalizar según el equipo o la fecha
    return STREAMS.youtube.liveUrl;
}
