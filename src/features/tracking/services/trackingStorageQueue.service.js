let storageWriteQueue = Promise.resolve();

export const enqueueTrackingStorageWrite = (operation) => {
  const pendingOperation = storageWriteQueue.then(operation, operation);
  storageWriteQueue = pendingOperation.catch(() => undefined);
  return pendingOperation;
};

export const flushTrackingStorageWrites = () => storageWriteQueue;
