# 🐾 GuardianPet

Ecossistema de saúde digital para pets – prontuário, scanner de ração, 
protocolo de emergência e dead man's switch para tutores.

## Stack
- HTML/CSS/JS (sem framework)
- Firebase Auth + Firestore
- QR Code via qrcodejs
- OCR via Tesseract.js

## Como rodar locally
1. Clone o repositório: git clone https://github.com/GuardianPet/guardianpet
2. Abra com Live Server no VSCode (ou qualquer servidor local)
3. Não abra o index.html direto como arquivo – use um servidor

## Funcionalidades
- [x] Prontuário digital com QR Code
- [x] Scanner de ração por nome e OCR
- [x] Dead Man's Switch (check-in de segurança)
- [x] Temas visuais (claro, escuro, oceano, âmbar, coral)
- [x] Autenticação Google + e-mail/senha
- [x] Planos (free / mensal / anual via Pix)

## Segurança
- Dados protegidos por Firestore Security Rules
- Cada usuário acessa apenas seus próprios dados
- Prontuário público expira em 72h automaticamente
