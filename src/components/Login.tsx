import { Sprite } from './ui';

export function Login({ loading, error, onSignIn }: { loading: boolean; error: string | null; onSignIn: () => void }) {
  return (
    <div className="login">
      <div className="panel">
        <Sprite level={3} cape={false} size={96} />
        <span className="ps gold" style={{ fontSize: 16 }}>LIFE RPG</span>
        {loading ? (
          <span className="muted">Yükleniyor…</span>
        ) : (
          <>
            <span className="muted">İlerlemen hesabına bağlı kalır, telefon ve bilgisayarda aynıdır.</span>
            <button className="btn" onClick={onSignIn}>GOOGLE İLE GİRİŞ</button>
            {error && <span className="red small">{error}</span>}
          </>
        )}
      </div>
    </div>
  );
}
