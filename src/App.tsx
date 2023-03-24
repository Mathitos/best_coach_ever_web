import React, { useState, useEffect } from "react";
import {
  googleLogout,
  TokenResponse,
  useGoogleLogin,
} from "@react-oauth/google";
import axios from "axios";

type WeightData = {
  weight: number;
  date: number;
};

type UserProfileData = {
  picture: string;
  name: string;
  email: string;
};

function App() {
  const [user, setUser] = useState<TokenResponse>();
  const [profile, setProfile] = useState<any>();
  const [weightData, setWeightData] = useState<Array<WeightData>>([]);

  const login = useGoogleLogin({
    scope:
      "openid https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/fitness.body.write https://www.googleapis.com/auth/fitness.nutrition.write https://www.googleapis.com/auth/fitness.body.read https://www.googleapis.com/auth/fitness.nutrition.read https://www.googleapis.com/auth/fitness.activity.read https://www.googleapis.com/auth/fitness.body.read https://www.googleapis.com/auth/fitness.location.read",
    onSuccess: (codeResponse) => setUser(codeResponse),
    onError: (error) => console.error("Login Failed:", error),
  });

  useEffect(() => {
    if (user) {
      axios
        .get(
          `https://www.googleapis.com/oauth2/v1/userinfo?access_token=${user.access_token}`,
          {
            headers: {
              Authorization: `Bearer ${user.access_token}`,
              Accept: "application/json",
            },
          }
        )
        .then((res) => {
          setProfile(res.data);
        })
        .catch((err) => console.error(err));
      const now = Date.now();
      const oneMonthsAgo = Date.now() - 2629743000;
      const oneDay = 86400000;
      axios
        .post(
          `https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate`,
          {
            aggregateBy: [
              {
                dataTypeName: "com.google.weight.summary",
                dataSourceId:
                  "derived:com.google.weight:com.google.android.gms:merge_weight",
              },
            ],
            bucketByTime: {
              durationMillis: oneDay,
            },
            startTimeMillis: oneMonthsAgo,
            endTimeMillis: now,
          },
          {
            headers: {
              Authorization: `Bearer ${user.access_token}`,
              Accept: "application/json",
            },
          }
        )
        .then((res) => {
          const data: Array<WeightData> = res.data.bucket.flatMap(
            (bucket: any) => {
              const entry = bucket.dataset[0]?.point[0];
              return entry
                ? {
                    weight: entry.value[0].fpVal,
                    date: entry.startTimeNanos / 1000,
                  }
                : [];
            }
          );
          setWeightData(data);
          return data;
        })
        .catch((err) => console.error(err));
    }
  }, [user]);

  // log out function to log the user out of google and set the profile array to null
  const logOut = () => {
    googleLogout();
    setProfile(null);
    setWeightData([]);
  };

  return (
    <div>
      <h2>Best Coach Ever</h2>
      {user ? (
        <>
          <UserProfile profile={profile} logOutCallback={logOut} />
          <WeightChart weightData={weightData} />
        </>
      ) : (
        <GoogleSignInButton loginCallback={login} />
      )}
    </div>
  );
}

const GoogleSignInButton = ({
  loginCallback,
}: {
  loginCallback: () => void;
}) => <button onClick={() => loginCallback()}>Sign in with Google 🚀 </button>;

const UserProfile = ({
  profile,
  logOutCallback,
}: {
  profile: UserProfileData;
  logOutCallback: () => void;
}) => {
  return profile ? (
    <div>
      <img src={profile.picture} alt="user image" />
      <h3>User Logged in</h3>
      <p>Name: {profile.name}</p>
      <p>Email Address: {profile.email}</p>
      <br />
      <br />
      <button onClick={logOutCallback}>Log out</button>
    </div>
  ) : (
    <LoadingScreen />
  );
};

const WeightChart = ({ weightData }: { weightData: Array<WeightData> }) => {
  return (
    <>
      {weightData.map((data) => (
        <div>
          <p>weight {data.weight}</p>
          <p>date {new Date(data.date).toISOString()}</p>
        </div>
      ))}
    </>
  );
};

const LoadingScreen = () => <div />;
export default App;
