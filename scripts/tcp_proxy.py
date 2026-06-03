import socket
import threading
import sys

def handle_client(client_socket, target_host, target_port):
    target_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    try:
        target_socket.connect((target_host, target_port))
    except Exception as e:
        client_socket.close()
        return

    def forward(source, destination):
        try:
            while True:
                data = source.recv(4096)
                if len(data) == 0:
                    break
                destination.sendall(data)
        except Exception:
            pass
        finally:
            source.close()
            destination.close()

    threading.Thread(target=forward, args=(client_socket, target_socket), daemon=True).start()
    threading.Thread(target=forward, args=(target_socket, client_socket), daemon=True).start()

def start_proxy(listen_port, target_host, target_port):
    server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    try:
        server.bind(('0.0.0.0', listen_port))
        server.listen(100)
        print(f"[+] Proxy ativo: 0.0.0.0:{listen_port} -> {target_host}:{target_port}")
    except Exception as e:
        print(f"[-] Erro ao bindar na porta {listen_port}: {e}")
        return

    while True:
        try:
            client_sock, addr = server.accept()
            threading.Thread(target=handle_client, args=(client_sock, target_host, target_port), daemon=True).start()
        except KeyboardInterrupt:
            break
        except Exception:
            pass

if __name__ == '__main__':
    if len(sys.argv) < 4:
        print("Uso: python tcp_proxy.py <listen_port> <target_host> <target_port>")
        sys.exit(1)
    
    listen_port = int(sys.argv[1])
    target_host = sys.argv[2]
    target_port = int(sys.argv[3])
    
    start_proxy(listen_port, target_host, target_port)
