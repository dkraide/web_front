import Button from 'react-bootstrap/Button';

type Props = {
  label: string;
  onUpload: (file: File) => void;
  preview?: string;
};

export default function ImageUpload({ label, onUpload, preview }: Props) {
  return (
    <div
      style={{
        width: 260,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <label>{label}</label>

      <div
        style={{
          width: '100%',
          height: 160,
          borderRadius: 10,
          border: '1px dashed #ccc',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          background: '#fafafa',
        }}
      >
        {preview ? (
          <img
            src={preview}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <span style={{ color: '#999' }}>Sem imagem</span>
        )}
      </div>

      <Button
        size="sm"
        variant="outline-primary"
        onClick={() => document.getElementById(label)?.click()}
      >
        Escolher imagem
      </Button>

      <input
        id={label}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          if (e.target.files?.[0]) {
            onUpload(e.target.files[0]);
          }
        }}
      />
    </div>
  );
}
