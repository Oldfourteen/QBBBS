function normalizeError(err, fallback) {
  const msg = err?.errMsg || err?.message || fallback;
  return new Error(msg);
}

function resolveChosenPath(res) {
  if (res?.tempFilePaths?.length) return res.tempFilePaths[0];
  if (res?.tempFiles?.length) {
    const file = res.tempFiles[0];
    return file.path || file.tempFilePath;
  }
  return '';
}

function choosePdfWithUniApi() {
  return new Promise((resolve, reject) => {
    if (typeof uni.chooseFile !== 'function') {
      reject(new Error('当前版本不支持文件选择，请升级 App'));
      return;
    }

    uni.chooseFile({
      count: 1,
      type: 'file',
      extension: ['.pdf'],
      success: (res) => {
        const filePath = resolveChosenPath(res);
        if (!filePath) {
          reject(new Error('未选择 PDF 文件'));
          return;
        }
        resolve(filePath);
      },
      fail: (err) => reject(normalizeError(err, '选择 PDF 失败'))
    });
  });
}

function copyAndroidUriToTemp(uri) {
  const main = plus.android.runtimeMainActivity();
  const contentResolver = main.getContentResolver();
  const OpenableColumns = plus.android.importClass('android.provider.OpenableColumns');
  const cursor = contentResolver.query(uri, null, null, null, null);

  let fileName = `schedule-${Date.now()}.pdf`;
  if (cursor && cursor.moveToFirst()) {
    const nameIndex = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME);
    if (nameIndex >= 0) {
      const displayName = cursor.getString(nameIndex);
      if (displayName) fileName = displayName;
    }
    cursor.close();
  }

  const tempDir = plus.io.convertLocalFileSystemURL('_doc/');
  const targetPath = `${tempDir}${fileName}`;
  const inputStream = contentResolver.openInputStream(uri);
  const FileOutputStream = plus.android.importClass('java.io.FileOutputStream');
  const File = plus.android.importClass('java.io.File');
  const targetFile = new File(targetPath);
  const outputStream = new FileOutputStream(targetFile);

  const buffer = plus.android.newObject('byte[]', 8192);
  let length = inputStream.read(buffer);
  while (length > 0) {
    outputStream.write(buffer, 0, length);
    length = inputStream.read(buffer);
  }

  outputStream.flush();
  outputStream.close();
  inputStream.close();
  return targetPath;
}

function choosePdfOnAndroid() {
  return new Promise((resolve, reject) => {
    const main = plus.android.runtimeMainActivity();
    const Intent = plus.android.importClass('android.content.Intent');
    const intent = new Intent(Intent.ACTION_GET_CONTENT);
    intent.setType('application/pdf');
    intent.addCategory(Intent.CATEGORY_OPENABLE);

    const requestCode = 9527;
    const previousHandler = main.onActivityResult;

    main.onActivityResult = function (code, resultCode, data) {
      main.onActivityResult = previousHandler || null;
      if (code !== requestCode) return;

      if (resultCode !== -1 || !data) {
        reject(new Error('未选择 PDF 文件'));
        return;
      }

      try {
        const uri = data.getData();
        const filePath = copyAndroidUriToTemp(uri);
        resolve(filePath);
      } catch (err) {
        reject(normalizeError(err, '读取 PDF 失败'));
      }
    };

    main.startActivityForResult(intent, requestCode);
  });
}

function choosePdfOnAppPlus() {
  if (typeof plus === 'undefined') {
    return Promise.reject(new Error('当前环境不支持选择 PDF'));
  }
  if (plus.os.name === 'Android') {
    return choosePdfOnAndroid();
  }
  return choosePdfWithUniApi();
}

export function choosePdfFile() {
  // #ifdef APP-PLUS
  if (typeof uni.chooseFile === 'function') {
    return choosePdfWithUniApi().catch(() => choosePdfOnAppPlus());
  }
  return choosePdfOnAppPlus();
  // #endif

  // #ifndef APP-PLUS
  return choosePdfWithUniApi();
  // #endif
}
