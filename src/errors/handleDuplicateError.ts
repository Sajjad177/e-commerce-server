import {
  TErrorSource,
  TGenericErrorResponse,
} from "../interface/globalInterface";

const handleDuplicateError = (error: any): TGenericErrorResponse => {
  const match = error?.message.match(/"([^"]*)"/);
  const extractedMessage = match && match[1];

  const errorSource: TErrorSource = [
    {
      path: "",
      message: `${extractedMessage} is already exist`,
    },
  ];

  const statusCode = 400;

  return {
    statusCode,
    message: "Duplicate name error",
    errorSource,
  };
};

export default handleDuplicateError;
