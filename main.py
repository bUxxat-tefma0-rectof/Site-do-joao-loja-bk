"""
Backend Plataforma Digital
FastAPI + Envio de E-mail + Verificação de Código
"""
import os
import random
import string
import time
from datetime import datetime, timedelta
from typing import Optional, Dict
import json

from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr, Field
from dotenv import load_dotenv

import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders

import uvicorn

# Carregar variáveis de ambiente
load_dotenv()

# ============================================
# CONFIGURAÇÕES
# ============================================
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", 8000))

# Configurações de E-mail
MAIL_USERNAME = os.getenv("MAIL_USERNAME")
MAIL_PASSWORD = os.getenv("MAIL_PASSWORD")
MAIL_FROM = os.getenv("MAIL_FROM")
MAIL_FROM_NAME = os.getenv("MAIL_FROM_NAME", "Plataforma Digital")
MAIL_PORT = int(os.getenv("MAIL_PORT", 587))
MAIL_SERVER = os.getenv("MAIL_SERVER", "smtp.gmail.com")
MAIL_STARTTLS = os.getenv("MAIL_STARTTLS", "True") == "True"
MAIL_SSL_TLS = os.getenv("MAIL_SSL_TLS", "False") == "True"

# Segurança
SECRET_KEY = os.getenv("SECRET_KEY", "chave_secreta_padrao")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))

# Frontend
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5500")

# ============================================
# APP FASTAPI
# ============================================
app = FastAPI(
    title="Plataforma Digital API",
    description="API para cadastro, login e envio de e-mails",
    version="1.0.0"
)

# CORS - Permitir requisições do frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Em produção, especifique os domínios
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================
# BANCO DE DADOS TEMPORÁRIO (Substitua por PostgreSQL depois)
# ============================================
usuarios_db: Dict[str, dict] = {}  # email -> dados do usuário
codigos_verificacao: Dict[str, dict] = {}  # email -> {codigo, expira_em, tentativas}
tokens_blacklist: list = []  # tokens invalidados

# ============================================
# MODELOS (Schemas)
# ============================================
class CadastroRequest(BaseModel):
    nome: str = Field(..., min_length=2, max_length=50, description="Nome do usuário")
    sobrenome: str = Field(..., min_length=2, max_length=50, description="Sobrenome")
    email: EmailStr = Field(..., description="E-mail válido")
    telefone: str = Field(..., min_length=10, max_length=15, description="Telefone")
    usuario: str = Field(..., min_length=4, max_length=30, description="Nome de usuário")
    senha: str = Field(..., min_length=6, max_length=100, description="Senha")

class VerificarCodigoRequest(BaseModel):
    email: EmailStr
    codigo: str = Field(..., min_length=6, max_length=6)

class ReenviarCodigoRequest(BaseModel):
    email: EmailStr

class LoginRequest(BaseModel):
    login: str = Field(..., description="Email ou usuário")
    senha: str = Field(..., description="Senha")

# ============================================
# FUNÇÕES AUXILIARES
# ============================================
def gerar_codigo_verificacao() -> str:
    """Gera código aleatório de 6 dígitos numéricos"""
    return ''.join(random.choices(string.digits, k=6))

def criar_template_email_html(nome: str, codigo: str) -> str:
    """Cria template HTML bonito para o e-mail"""
    return f"""
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
    </head>
    <body style="margin: 0; padding: 0; background-color: #0f0f1a; font-family: 'Segoe UI', Arial, sans-serif;">
        <div style="max-width: 500px; margin: 20px auto; background: #1a1a2e; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.5);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #6C63FF, #5A52D5); padding: 30px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px;">🚀 Plataforma Digital</h1>
                <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0;">Verificação de conta</p>
            </div>
            
            <!-- Body -->
            <div style="padding: 30px;">
                <h2 style="color: #ffffff; margin: 0 0 8px;">Olá, {nome}! 👋</h2>
                <p style="color: #b0b0b8; line-height: 1.6; margin: 0 0 24px;">
                    Você está a um passo de criar sua conta. Use o código abaixo para verificar seu e-mail:
                </p>
                
                <!-- Código -->
                <div style="background: #0f0f1a; border: 2px dashed #6C63FF; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
                    <span style="font-size: 36px; font-weight: 800; letter-spacing: 12px; color: #4ECDC4; font-family: 'Courier New', monospace;">
                        {codigo}
                    </span>
                </div>
                
                <p style="color: #6c6c8a; font-size: 13px; line-height: 1.5; margin: 0 0 24px;">
                    ⏰ Este código expira em <strong style="color: #FF6B6B;">10 minutos</strong>.<br>
                    🔒 Se você não solicitou este código, ignore este e-mail.
                </p>
                
                <div style="border-top: 1px solid #2d2d44; padding-top: 20px;">
                    <p style="color: #6c6c8a; font-size: 13px; margin: 0;">
                        Equipe Plataforma Digital<br>
                        <a href="#" style="color: #6C63FF; text-decoration: none;">suporte@plataformadigital.com.br</a>
                    </p>
                </div>
            </div>
            
            <!-- Footer -->
            <div style="background: #0f0f1a; padding: 16px; text-align: center;">
                <p style="color: #4a4a6a; font-size: 11px; margin: 0;">
                    © 2024 Plataforma Digital. Todos os direitos reservados.
                </p>
            </div>
        </div>
    </body>
    </html>
    """

def enviar_email_smtp(destinatario: str, assunto: str, corpo_html: str) -> bool:
    """Envia e-mail usando SMTP"""
    try:
        # Criar mensagem
        msg = MIMEMultipart('alternative')
        msg['Subject'] = assunto
        msg['From'] = f"{MAIL_FROM_NAME} <{MAIL_FROM}>"
        msg['To'] = destinatario
        
        # Versão texto puro (fallback)
        texto_puro = f"""
        Plataforma Digital - Verificação de Conta
        
        Seu código de verificação é: {corpo_html}
        
        Este código expira em 10 minutos.
        Se você não solicitou, ignore este e-mail.
        """
        
        part1 = MIMEText(texto_puro, 'plain')
        part2 = MIMEText(corpo_html, 'html')
        
        msg.attach(part1)
        msg.attach(part2)
        
        # Conectar ao servidor
        context = ssl.create_default_context()
        
        if MAIL_SSL_TLS:
            # SSL/TLS direto (porta 465)
            server = smtplib.SMTP_SSL(MAIL_SERVER, MAIL_PORT, context=context)
        else:
            # STARTTLS (porta 587)
            server = smtplib.SMTP(MAIL_SERVER, MAIL_PORT)
            server.ehlo()
            
            if MAIL_STARTTLS:
                server.starttls(context=context)
                server.ehlo()
        
        # Login
        server.login(MAIL_USERNAME, MAIL_PASSWORD)
        
        # Enviar
        server.sendmail(MAIL_FROM, destinatario, msg.as_string())
        
        # Fechar conexão
        server.quit()
        
        print(f"✅ E-mail enviado com sucesso para: {destinatario}")
        return True
        
    except smtplib.SMTPAuthenticationError:
        print("❌ Erro de autenticação SMTP. Verifique email e senha de app.")
        return False
    except smtplib.SMTPException as e:
        print(f"❌ Erro SMTP: {str(e)}")
        return False
    except Exception as e:
        print(f"❌ Erro ao enviar e-mail: {str(e)}")
        return False

# ============================================
# ROTAS DA API
# ============================================

@app.get("/")
async def raiz():
    """Rota raiz - Verifica se API está online"""
    return {
        "status": "online",
        "mensagem": "🚀 API Plataforma Digital rodando!",
        "versao": "1.0.0",
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    """Health check para monitoramento"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "usuarios_cadastrados": len(usuarios_db),
        "emails_pendentes": len(codigos_verificacao)
    }

# ============================================
# CADASTRO - ENVIAR CÓDIGO
# ============================================
@app.post("/api/cadastro/enviar-codigo")
async def enviar_codigo_verificacao(dados: CadastroRequest):
    """
    Etapa 1 do cadastro:
    - Valida dados
    - Gera código de 6 dígitos
    - Envia por e-mail
    - Retorna sucesso
    """
    try:
        email = dados.email.lower().strip()
        
        # Verificar se e-mail já está cadastrado
        if email in usuarios_db:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Este e-mail já está cadastrado"
            )
        
        # Verificar se usuário já existe
        for usuario_existente in usuarios_db.values():
            if usuario_existente.get('usuario') == dados.usuario:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Nome de usuário já está em uso"
                )
        
        # Gerar código
        codigo = gerar_codigo_verificacao()
        
        # Salvar código com expiração (10 minutos)
        codigos_verificacao[email] = {
            "codigo": codigo,
            "expira_em": datetime.now() + timedelta(minutes=10),
            "tentativas": 0,
            "dados_usuario": {
                "nome": dados.nome,
                "sobrenome": dados.sobrenome,
                "email": email,
                "telefone": dados.telefone,
                "usuario": dados.usuario,
                "senha": dados.senha  # Em produção, use hash!
            }
        }
        
        # Criar template do e-mail
        nome_completo = f"{dados.nome} {dados.sobrenome}"
        corpo_email = criar_template_email_html(dados.nome, codigo)
        
        # Enviar e-mail
        email_enviado = enviar_email_smtp(
            destinatario=email,
            assunto=f"{codigo} é seu código de verificação - Plataforma Digital",
            corpo_html=corpo_email
        )
        
        if not email_enviado:
            # Se falhar o envio, ainda retornamos o código para desenvolvimento
            print(f"⚠️ Falha ao enviar e-mail. Código para {email}: {codigo}")
            
            return JSONResponse(
                status_code=status.HTTP_207_MULTI_STATUS,
                content={
                    "sucesso": False,
                    "mensagem": "Não foi possível enviar o e-mail. Verifique as configurações SMTP.",
                    "codigo_desenvolvimento": codigo if os.getenv("AMBIENTE") == "desenvolvimento" else None,
                    "dica": "Configure as variáveis MAIL_USERNAME e MAIL_PASSWORD no arquivo .env"
                }
            )
        
        return {
            "sucesso": True,
            "mensagem": "Código de verificação enviado para seu e-mail!",
            "email": email,
            "expira_em": "10 minutos",
            "dica": "Verifique sua caixa de entrada e também a pasta de spam/lixo eletrônico"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Erro no cadastro: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro interno: {str(e)}"
        )

# ============================================
# VERIFICAR CÓDIGO
# ============================================
@app.post("/api/cadastro/verificar-codigo")
async def verificar_codigo(dados: VerificarCodigoRequest):
    """
    Etapa 2 do cadastro:
    - Verifica se o código está correto
    - Confirma o cadastro do usuário
    """
    try:
        email = dados.email.lower().strip()
        
        # Verificar se existe código para este e-mail
        if email not in codigos_verificacao:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Nenhum código encontrado. Solicite um novo."
            )
        
        info = codigos_verificacao[email]
        
        # Verificar expiração
        if datetime.now() > info['expira_em']:
            del codigos_verificacao[email]
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Código expirado. Solicite um novo."
            )
        
        # Verificar tentativas
        if info['tentativas'] >= 5:
            del codigos_verificacao[email]
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Muitas tentativas. Solicite um novo código."
            )
        
        # Incrementar tentativas
        info['tentativas'] += 1
        
        # Verificar código
        if dados.codigo != info['codigo']:
            tentativas_restantes = 5 - info['tentativas']
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Código inválido. Tentativas restantes: {tentativas_restantes}"
            )
        
        # CÓDIGO CORRETO - Finalizar cadastro
        dados_usuario = info['dados_usuario']
        
        # Salvar usuário no banco
        usuarios_db[email] = {
            "id": len(usuarios_db) + 1,
            "nome": dados_usuario['nome'],
            "sobrenome": dados_usuario['sobrenome'],
            "email": email,
            "telefone": dados_usuario['telefone'],
            "usuario": dados_usuario['usuario'],
            "senha": dados_usuario['senha'],  # Em produção, use hash!
            "data_cadastro": datetime.now().isoformat(),
            "ativo": True,
            "email_verificado": True
        }
        
        # Remover código usado
        del codigos_verificacao[email]
        
        print(f"✅ Usuário cadastrado com sucesso: {email}")
        
        return {
            "sucesso": True,
            "mensagem": "Conta verificada com sucesso!",
            "usuario": {
                "nome": dados_usuario['nome'],
                "sobrenome": dados_usuario['sobrenome'],
                "email": email,
                "usuario": dados_usuario['usuario']
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Erro na verificação: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro interno: {str(e)}"
        )

# ============================================
# REENVIAR CÓDIGO
# ============================================
@app.post("/api/cadastro/reenviar-codigo")
async def reenviar_codigo(dados: ReenviarCodigoRequest):
    """
    Reenvia o código de verificação por e-mail
    """
    try:
        email = dados.email.lower().strip()
        
        # Verificar se existe cadastro pendente
        if email not in codigos_verificacao:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Nenhum cadastro pendente. Inicie o cadastro novamente."
            )
        
        info = codigos_verificacao[email]
        dados_usuario = info['dados_usuario']
        
        # Gerar novo código
        novo_codigo = gerar_codigo_verificacao()
        
        # Atualizar informações
        codigos_verificacao[email] = {
            "codigo": novo_codigo,
            "expira_em": datetime.now() + timedelta(minutes=10),
            "tentativas": 0,
            "dados_usuario": dados_usuario
        }
        
        # Enviar e-mail
        corpo_email = criar_template_email_html(dados_usuario['nome'], novo_codigo)
        
        email_enviado = enviar_email_smtp(
            destinatario=email,
            assunto=f"{novo_codigo} é seu novo código - Plataforma Digital",
            corpo_html=corpo_email
        )
        
        if not email_enviado:
            print(f"⚠️ Falha ao reenviar. Código para {email}: {novo_codigo}")
            return JSONResponse(
                status_code=status.HTTP_207_MULTI_STATUS,
                content={
                    "sucesso": False,
                    "mensagem": "Erro ao enviar e-mail. Tente novamente.",
                    "codigo_desenvolvimento": novo_codigo if os.getenv("AMBIENTE") == "desenvolvimento" else None
                }
            )
        
        return {
            "sucesso": True,
            "mensagem": "Novo código enviado para seu e-mail!",
            "expira_em": "10 minutos"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro interno: {str(e)}"
        )

# ============================================
# LOGIN
# ============================================
@app.post("/api/login")
async def login(dados: LoginRequest):
    """
    Login do usuário
    Aceita email ou nome de usuário
    """
    try:
        usuario_encontrado = None
        
        # Buscar por email ou usuário
        for email, usuario in usuarios_db.items():
            if usuario['email'] == dados.login or usuario['usuario'] == dados.login:
                usuario_encontrado = usuario
                break
        
        if not usuario_encontrado:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Usuário ou senha inválidos"
            )
        
        # Verificar senha (simples - use hash em produção!)
        if usuario_encontrado['senha'] != dados.senha:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Usuário ou senha inválidos"
            )
        
        # Verificar se está ativo
        if not usuario_encontrado.get('ativo', True):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Conta desativada. Entre em contato com o suporte."
            )
        
        return {
            "sucesso": True,
            "mensagem": "Login realizado com sucesso!",
            "usuario": {
                "id": usuario_encontrado['id'],
                "nome": usuario_encontrado['nome'],
                "sobrenome": usuario_encontrado['sobrenome'],
                "email": usuario_encontrado['email'],
                "usuario": usuario_encontrado['usuario']
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro interno: {str(e)}"
        )

# ============================================
# INICIALIZAÇÃO
# ============================================
if __name__ == "__main__":
    print("=" * 60)
    print("🚀 PLATAFORMA DIGITAL - BACKEND")
    print("=" * 60)
    print(f"📧 Servidor SMTP: {MAIL_SERVER}:{MAIL_PORT}")
    print(f"📨 E-mail remetente: {MAIL_FROM}")
    print(f"🌐 Frontend: {FRONTEND_URL}")
    print(f"🔗 Documentação: http://localhost:{PORT}/docs")
    print("=" * 60)
    
    if not MAIL_USERNAME or not MAIL_PASSWORD:
        print("⚠️  ATENÇÃO: Configure MAIL_USERNAME e MAIL_PASSWORD no arquivo .env")
        print("   Para Gmail, use uma 'Senha de App':")
        print("   1. Acesse: https://myaccount.google.com/apppasswords")
        print("   2. Gere uma senha para 'E-mail'")
        print("   3. Cole no arquivo .env")
    else:
        print("✅ Configurações de e-mail encontradas!")
    
    print("=" * 60)
    
    uvicorn.run(
        "main:app",
        host=HOST,
        port=PORT,
        reload=True,
        log_level="info"
    )
