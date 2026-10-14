# Security checklist

Prima di pubblicare BIMARIS in produzione:

1. Proteggere tutte le route `/admin` con autenticazione e controllo ruolo server-side.
2. Mantenere `SUPABASE_SERVICE_ROLE_KEY` esclusivamente sul server.
3. Aggiungere rate limiting agli endpoint pubblici, in particolare analytics e candidatura operatori.
4. Validare tutti i payload con schema validation.
5. Aggiungere CAPTCHA/anti-spam ai form pubblici.
6. Configurare CORS e Content Security Policy.
7. Separare development, staging e production.
8. Eseguire regolarmente audit dipendenze e aggiornamenti di sicurezza.
9. Configurare backup e retention del database.
10. Applicare la privacy by design: minimizzazione, consenso granulare e retention limitata dei dati analytics.
