"""Управление людьми: добавить, получить список, удалить"""
import json
import os
import base64
import boto3
import psycopg2


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def verify_token(cur, token: str):
    cur.execute("SELECT s.user_id FROM sessions s WHERE s.token = %s", (token,))
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
            cur.execute("SELECT id, full_name, photo_url, created_at FROM people WHERE user_id = %s ORDER BY created_at DESC", (user_id,))
            rows = cur.fetchall()
            people = [{'id': r[0], 'full_name': r[1], 'photo_url': r[2], 'created_at': str(r[3])} for r in rows]
            return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'people': people})}

        elif method == 'POST':
            body = json.loads(event.get('body') or '{}')
            full_name = body.get('full_name', '').strip()
            photo_data = body.get('photo_data')
            photo_url = None

            if not full_name:
                return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'ФИО обязательно'})}

            if photo_data:
                s3 = boto3.client(
                    's3',
                    endpoint_url='https://bucket.poehali.dev',
                    aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
                    aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY']
                )
                img_bytes = base64.b64decode(photo_data.split(',')[-1])
                key = f"people/{user_id}_{full_name.replace(' ', '_')}.jpg"
                s3.put_object(Bucket='files', Key=key, Body=img_bytes, ContentType='image/jpeg')
                photo_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"

            cur.execute(
                "INSERT INTO people (user_id, full_name, photo_url) VALUES (%s, %s, %s) RETURNING id, full_name, photo_url, created_at",
                (user_id, full_name, photo_url)
            )
            row = cur.fetchone()
            conn.commit()
            return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'person': {'id': row[0], 'full_name': row[1], 'photo_url': row[2], 'created_at': str(row[3])}})}

        else:
            return {'statusCode': 405, 'headers': headers, 'body': json.dumps({'error': 'Метод не поддерживается'})}
    finally:
        cur.close()
        conn.close()
