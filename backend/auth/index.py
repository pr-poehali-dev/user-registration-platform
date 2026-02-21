"""Аутентификация: регистрация, вход, выход, проверка сессии"""
import json
import os
import hashlib
import secrets
import psycopg2


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def handler(event: dict, context) -> dict:
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token, X-Session-Id',
        'Content-Type': 'application/json'
    }

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': headers, 'body': ''}

    body = json.loads(event.get('body') or '{}')
    action = body.get('action')

    conn = get_conn()
    cur = conn.cursor()

    try:
        if action == 'register':
            login = body.get('login', '').strip()
            password = body.get('password', '')
            if not login or not password:
                return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Логин и пароль обязательны'})}
            if len(password) < 4:
                return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Пароль минимум 4 символа'})}
            cur.execute("SELECT id FROM users WHERE login = %s", (login,))
            if cur.fetchone():
                return {'statusCode': 409, 'headers': headers, 'body': json.dumps({'error': 'Логин уже занят'})}
            cur.execute("INSERT INTO users (login, password_hash) VALUES (%s, %s) RETURNING id", (login, hash_password(password)))
            user_id = cur.fetchone()[0]
            token = secrets.token_hex(32)
            cur.execute("INSERT INTO sessions (user_id, token) VALUES (%s, %s)", (user_id, token))
            conn.commit()
            return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'token': token, 'user_id': user_id, 'login': login})}

        elif action == 'login':
            login = body.get('login', '').strip()
            password = body.get('password', '')
            cur.execute("SELECT id FROM users WHERE login = %s AND password_hash = %s", (login, hash_password(password)))
            row = cur.fetchone()
            if not row:
                return {'statusCode': 401, 'headers': headers, 'body': json.dumps({'error': 'Неверный логин или пароль'})}
            user_id = row[0]
            token = secrets.token_hex(32)
            cur.execute("INSERT INTO sessions (user_id, token) VALUES (%s, %s)", (user_id, token))
            conn.commit()
            return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'token': token, 'user_id': user_id, 'login': login})}

        elif action == 'check':
            token = body.get('token')
            if not token:
                return {'statusCode': 401, 'headers': headers, 'body': json.dumps({'error': 'Нет токена'})}
            cur.execute("SELECT s.user_id, u.login FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = %s", (token,))
            row = cur.fetchone()
            if not row:
                return {'statusCode': 401, 'headers': headers, 'body': json.dumps({'error': 'Сессия не найдена'})}
            return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'user_id': row[0], 'login': row[1]})}

        else:
            return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Неизвестное действие'})}
    finally:
        cur.close()
        conn.close()
