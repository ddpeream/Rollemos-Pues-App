import { useState, useEffect, useRef } from "react";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { supabase } from "../config/supabase";
import { useAppStore } from "../store/useAppStore";
import { navigate } from "../navigation/navigationRef";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const usePushNotifications = () => {
  const user = useAppStore((state) => state.user);
  const [expoPushToken, setExpoPushToken] = useState("");
  const [notification, setNotification] = useState(null);
  const notificationListener = useRef();
  const responseListener = useRef();

  const markNotificationRead = async (notificationId) => {
    if (!notificationId || !user?.id) return;

    const { error } = await supabase
      .from("notificaciones")
      .update({ leida: true })
      .eq("id", notificationId)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error marcando notificacion como leida:", error);
    }
  };

  const handleNotificationNavigation = (data) => {
    if (!data) return;

    const tipo = data.tipo;
    const galeriaId = data.galeria_id;
    const comentarioId = data.comentario_id;
    const parcheId = data.parche_id;
    const rodadaId = data.rodada_id;
    const fromUserId = data.from_user_id;
    const notificationId = data.notification_id;

    markNotificationRead(notificationId);

    if (tipo === "like" || tipo === "comentario") {
      navigate("MainTabs", {
        screen: "Galeria",
        params: {
          postId: galeriaId,
          commentId: comentarioId,
        },
      });
      return;
    }

    if (tipo === "seguidor") {
      if (parcheId) {
        navigate("DetalleParche", { parcheId });
        return;
      }
      if (fromUserId) {
        navigate("PerfilUsuario", { userId: fromUserId });
      }
    }

    if (tipo === "rodada" && rodadaId) {
      navigate("MainTabs", {
        screen: "Rutas",
        params: {
          screen: "TrackingMain",
          params: { rodadaId },
        },
      });
    }
  };

  useEffect(() => {
    if (user?.id) {
      registerForPushNotificationsAsync().then((token) => {
        if (token) {
          setExpoPushToken(token);
          savePushTokenToDatabase(token);
        }
      });

      notificationListener.current =
        Notifications.addNotificationReceivedListener((notification) => {
          setNotification(notification);
          console.log("Notificacion recibida:", notification);
        });

      responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log("Notificacion tocada:", response);
        const data = response?.notification?.request?.content?.data;
        handleNotificationNavigation(data);
      });

      Notifications.getLastNotificationResponseAsync().then((response) => {
        if (!response) return;
        const data = response?.notification?.request?.content?.data;
        handleNotificationNavigation(data);
      });

      return () => {
        notificationListener.current?.remove();
        responseListener.current?.remove();
      };
    }
  }, [user?.id]);

  const registerForPushNotificationsAsync = async () => {
    if (!Device.isDevice) {
      console.log("Push solo funciona en dispositivos fisicos");
      return null;
    }

    try {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        console.log("Sin permisos para notificaciones");
        return null;
      }

      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      const tokenData = projectId
        ? await Notifications.getExpoPushTokenAsync({ projectId })
        : await Notifications.getExpoPushTokenAsync();
      console.log("Token obtenido:", tokenData.data);

      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "default",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#FF231F7C",
        });
      }

      return tokenData.data;
    } catch (error) {
      console.error("Error obteniendo token:", error);
      return null;
    }
  };

  const savePushTokenToDatabase = async (token) => {
    if (!user?.id || !token) return;

    try {
      const { error } = await supabase
        .from("usuarios")
        .update({ expo_push_token: token })
        .eq("id", user.id);

      if (error) {
        console.error("Error guardando token:", error);
      } else {
        console.log("Token guardado en BD");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return { expoPushToken, notification };
};

