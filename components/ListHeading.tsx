import React from 'react';
import { Text, View } from 'react-native';

const ListHeading = ({ title }: ListHeadingProps) => {
  return (
    <View className="list-head">
      <Text className="list-title">{title}</Text>
    </View>
  );
};

export default ListHeading;
