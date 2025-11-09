# 📱 Generar APK - Rollemos Pues

## Comando para generar el APK:

```bash
npx eas-cli build --platform android --profile preview
```

## Pasos completos:

1. **Asegúrate de estar en la carpeta correcta:**
   ```bash
   cd mobile-app
   ```

2. **Genera el APK:**
   ```bash
   npx eas-cli build --platform android --profile preview
   ```

3. **Espera a que termine el build** (puede tardar 10-20 minutos en la cola gratuita)

4. **Descarga el APK** desde el link que te da en la terminal o desde:
   https://expo.dev/accounts/ddpeream/projects/rollemos-pues/builds

## Notas:
- El APK se genera en los servidores de Expo (EAS Build)
- Tu proyecto ID: `a5a8c678-8e55-45bf-80ec-f90edd49b7f7`
- Owner: `ddpeream`
- El ícono del patín ya está configurado en `assets/icon.png`

## Si quieres ver el progreso:
```bash
npx eas-cli build:list
```

## Para cancelar un build:
```bash
npx eas-cli build:cancel
```
