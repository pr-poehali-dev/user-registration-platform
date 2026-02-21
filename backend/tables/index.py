"""Управление Excel-таблицами: создать, сохранить, получить список"""
import json
import os
import psycopg2


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def verify_token(cur, token: str):
    cur.execute("SELECT user_id FROM sessions WHERE token = %s", (token,))
    row = cur.fetchone()
    return row[0] if row else None


def handler(event: dict, context) -> dict:
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token, X-Session-Id',
        'Content-Type': 'application/json'
    }

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': headers, 'body': ''}

    token = event.get('headers', {}).get('X-Auth-Token') or event.get('headers', {}).get('x-auth-token')
    conn = get_conn()
    cur = conn.cursor()

    try:
        user_id = verify_token(cur, token) if token else None
        if not user_id:
            return {'statusCode': 401, 'headers': headers, 'body': json.dumps({'error': 'Не авторизован'})}

        method = event.get('httpMethod')

        if method == 'GET':
            cur.execute("SELECT id, name, data, created_at, updated_at FROM excel_tables WHERE user_id = %s ORDER BY updated_at DESC", (user_id,))
            rows = cur.fetchall()
            tables = [{'id': r[0], 'name': r[1], 'data': r[2], 'created_at': str(r[3]), 'updated_at': str(r[4])} for r in rows]
            return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'tables': tables})}

        elif method == 'POST':
            body = json.loads(event.get('body') or '{}')
            name = body.get('name', 'Таблица').strip()
            data = body.get('data', {})
            cur.execute(
                "INSERT INTO excel_tables (user_id, name, data) VALUES (%s, %s, %s) RETURNING id, name, created_at",
                (user_id, name, json.dumps(data))
            )
            row = cur.fetchone()
            conn.commit()
            return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'table': {'id': row[0], 'name': row[1], 'created_at': str(row[2])}})}

        elif method == 'PUT':
            body = json.loads(event.get('body') or '{}')
            table_id = body.get('id')
            name = body.get('name', 'Таблица')
            data = body.get('data', {})
            cur.execute(
                "UPDATE excel_tables SET name = %s, data = %s, updated_at = NOW() WHERE id = %s AND user_id = %s",
                (name, json.dumps(data), table_id, user_id)
            )
            conn.commit()
            return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'ok': True})}

        else:
            return {'statusCode': 405, 'headers': headers, 'body': json.dumps({'error': 'Метод не поддерживается'})}
    finally:
        cur.close()
        conn.close()
