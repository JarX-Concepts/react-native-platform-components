module.exports = {
  dependency: {
    platforms: {
      android: {
        componentDescriptors: [
          'MeasuringPCSelectionMenuComponentDescriptor',
          'MeasuringPCDatePickerComponentDescriptor',
        ],
        cmakeListsPath: 'src/main/jni/CMakeLists.txt',
      },
    },
  },
};
