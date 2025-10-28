import json
import time
from typing import Dict, Any, List

active_connections: Dict[str, Dict[str, Any]] = {}
world_state: Dict[str, str] = {}

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Multiplayer API for real-time game state sync
    Args: event with httpMethod, body for player updates
          context with request_id
    Returns: HTTP response with player/world state
    '''
    method = event.get('httpMethod', 'POST')
    
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    }
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': headers,
            'body': '',
            'isBase64Encoded': False
        }
    
    request_context = event.get('requestContext', {})
    route_key = request_context.get('routeKey', '')
    connection_id = request_context.get('connectionId', f'client-{int(time.time() * 1000)}')
    
    body_str = event.get('body', '{}')
    if isinstance(body_str, str):
        try:
            body = json.loads(body_str) if body_str else {}
        except json.JSONDecodeError:
            body = {}
    else:
        body = body_str
    
    if route_key == '$connect':
        active_connections[connection_id] = {
            'id': connection_id,
            'connected_at': time.time(),
            'position': [0, 32, 0],
            'rotation': [0, 0],
        }
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({'message': 'Connected', 'playerId': connection_id}),
            'isBase64Encoded': False
        }
    
    if route_key == '$disconnect':
        if connection_id in active_connections:
            del active_connections[connection_id]
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({'message': 'Disconnected'}),
            'isBase64Encoded': False
        }
    
    if route_key == '$default' or method == 'POST':
        action = body.get('action', '')
        
        if action == 'updatePosition':
            position = body.get('position', [0, 32, 0])
            rotation = body.get('rotation', [0, 0])
            
            if connection_id in active_connections:
                active_connections[connection_id]['position'] = position
                active_connections[connection_id]['rotation'] = rotation
            
            players_list = [
                {
                    'id': pid,
                    'position': pdata['position'],
                    'rotation': pdata['rotation'],
                }
                for pid, pdata in active_connections.items()
                if pid != connection_id
            ]
            
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({
                    'action': 'playerUpdate',
                    'players': players_list
                }),
                'isBase64Encoded': False
            }
        
        elif action == 'placeBlock':
            x = body.get('x', 0)
            y = body.get('y', 0)
            z = body.get('z', 0)
            block_type = body.get('type', 'stone')
            
            key = f"{x},{y},{z}"
            world_state[key] = block_type
            
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({
                    'action': 'blockPlaced',
                    'x': x, 'y': y, 'z': z,
                    'type': block_type
                }),
                'isBase64Encoded': False
            }
        
        elif action == 'removeBlock':
            x = body.get('x', 0)
            y = body.get('y', 0)
            z = body.get('z', 0)
            
            key = f"{x},{y},{z}"
            if key in world_state:
                del world_state[key]
            
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({
                    'action': 'blockRemoved',
                    'x': x, 'y': y, 'z': z
                }),
                'isBase64Encoded': False
            }
        
        elif action == 'getPlayers':
            players_list = [
                {
                    'id': pid,
                    'position': pdata['position'],
                    'rotation': pdata['rotation'],
                }
                for pid, pdata in active_connections.items()
            ]
            
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({
                    'action': 'playersData',
                    'players': players_list
                }),
                'isBase64Encoded': False
            }
    
    return {
        'statusCode': 200,
        'headers': headers,
        'body': json.dumps({'message': 'OK'}),
        'isBase64Encoded': False
    }