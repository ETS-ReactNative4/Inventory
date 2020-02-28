/**
 * Sample React Native App with Firebase
 * https://github.com/invertase/react-native-firebase
 *
 * @format
 * @flow
 */
import "react-native-gesture-handler";
import React, { Component } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { Platform } from "react-native";
import { Login } from "./components/login";
import auth from "@react-native-firebase/auth";
import { Home } from "./components/home";
import {
  Appbar,
  Provider as PaperProvider,
  Menu,
  ActivityIndicator
} from "react-native-paper";
import { FireStoreService } from "./services/FireStoreService";
import { createStackNavigator } from "@react-navigation/stack";
import firestore from "@react-native-firebase/firestore";
import ItemDetail from "./components/item-detail";
import storage from "@react-native-firebase/storage";
import UserProfile from "./components/user-profile";
import ItemDetailAction from "./components/item-detail-action";
import { Register } from "./components/register";

// TODO(you): import any additional firebase services that you require for your app, e.g for auth:
//    1) install the npm package: `yarn add @react-native-firebase/auth@alpha` - you do not need to
//       run linking commands - this happens automatically at build time now
//    2) rebuild your app via `yarn run run:android` or `yarn run run:ios`
//    3) import the package here in your JavaScript code: `import '@react-native-firebase/auth';`
//    4) The Firebase Auth service is now available to use here: `firebase.auth().currentUser`

const instructions = Platform.select({
  ios: "Press Cmd+R to reload,\nCmd+D or shake for dev menu",
  android:
    "Double tap R on your keyboard to reload,\nShake or press menu button for dev menu"
});

const firebaseCredentials = Platform.select({
  ios: "https://invertase.link/firebase-ios",
  android: "https://invertase.link/firebase-android"
});

type Props = {};
const Stack = createStackNavigator();

class MyHeader extends React.Component {
  constructor(props) {
    super(props);
    this.previous = props.previous;
    this.scene = props.scene;
    this.navigation = props.navigation;
    this.auth = props.auth;
    this.user = props.user.storeUser;
    this.showMenu = this.showMenu.bind(this);
    this.onMenuDismiss = this.onMenuDismiss.bind(this);
    this.logOut = this.logOut.bind(this);
    this.state = { showMenu: false };
  }

  logOut() {
    this.auth
      .signOut()
      .then(() => console.log("Signed Out"), error => console.error(error));
  }
  showMenu() {
    this.setState({ showMenu: true });
  }
  onMenuDismiss() {
    this.setState({ showMenu: false });
  }
  render() {
    return (
      <Appbar.Header>
        {this.previous ? (
          <Appbar.BackAction onPress={this.navigation.goBack} />
        ) : (
          <></>
        )}
        <Appbar.Content title={"Inventory List"} />
        <Menu
          onDismiss={this.onMenuDismiss}
          visible={this.state.showMenu}
          anchor={
            <Appbar.Action
              icon={"menu"}
              color={"white"}
              onPress={this.showMenu}
            />
          }
        >
          <Menu.Item
            icon="check"
            title={"My Profile"}
            onPress={() => {
              this.onMenuDismiss();
              this.navigation.navigate("UserProfile");
            }}
          />
          <Menu.Item icon="logout" title="Log Out" onPress={this.logOut} />
        </Menu>
      </Appbar.Header>
    );
  }
}

export default class App extends Component<Props> {
  menuRef = React.createRef();
  constructor(props) {
    super(props);
    this.state = {
      user: null,
      loading: false
    };
    this.auth = auth();
    this.fireStore = firestore();
    this.storageService = new FireStoreService(this.fireStore);
    this.fileStore = storage();
  }
  componentDidMount(): void {
    console.log("App Started");
    this.authUnSubscriber = this.auth.onAuthStateChanged(user => {
      console.log("Auth State Changed", user);
      this.state.loading = true;
      this.setState(this.state);
      if (user !== null) {
        this.storageService
          .getCollection("users")
          .where("email", "==", user.email)
          .get()
          .then(
            snapshot => {
              console.log(snapshot);
              let usr =
                snapshot.docs.length > 0 ? snapshot.docs[0].data() : null;
              if (usr !== null) {
                usr.id = snapshot.docs[0].id;
                console.log(usr);
                this.setState({
                  user: { authUser: user, storeUser: usr },
                  loading: false
                });
              }
            },
            error => this.setState({ user: null, loading: false })
          );
      } else {
        this.setState({ user: null, loading: false });
      }
    });
  }

  componentWillUnmount(): void {
    console.log("UnMounting Component");
    this.authUnSubscriber();
  }

  render() {
    if (this.state.loading) return <ActivityIndicator />;
    return (
      <PaperProvider>
        <NavigationContainer>
          {this.state.user ? (
            <Stack.Navigator
              initialRouteName={"Home"}
              headerMode={"screen"}
              screenOptions={{
                header: ({ scene, previous, navigation }) => (
                  <MyHeader
                    scene={scene}
                    previous={previous}
                    navigation={navigation}
                    auth={this.auth}
                    user={this.state.user}
                  />
                )
              }}
            >
              <Stack.Screen name={"Home"}>
                {props => (
                  <Home
                    {...props}
                    storageService={this.storageService}
                    fileStore={this.fileStore}
                    user={this.state.user}
                  />
                )}
              </Stack.Screen>
              <Stack.Screen name={"ItemDetail"}>
                {props => (
                  <ItemDetail
                    {...props}
                    storageService={this.storageService}
                    fileStore={this.fileStore}
                    user={this.state.user}
                  />
                )}
              </Stack.Screen>
              <Stack.Screen name={"ItemDetailAction"}>
                {props => (
                  <ItemDetailAction
                    {...props}
                    storageService={this.storageService}
                    fileStore={this.fileStore}
                    user={this.state.user}
                  />
                )}
              </Stack.Screen>
              <Stack.Screen name={"UserProfile"}>
                {props => (
                  <UserProfile
                    {...props}
                    storageService={this.storageService}
                    fileStore={this.fileStore}
                    user={this.state.user}
                  />
                )}
              </Stack.Screen>
            </Stack.Navigator>
          ) : (
            <Stack.Navigator
              initialRouteName={"Login"}
              screenOptions={{
                headerShown: false
              }}
            >
              <Stack.Screen name={"Login"}>
                {props => <Login {...props} auth={this.auth} />}
              </Stack.Screen>
              <Stack.Screen name={"Register"}>
                {props => (
                  <Register
                    {...props}
                    storageService={this.storageService}
                    fileStore={this.fileStore}
                    auth={this.auth}
                  />
                )}
              </Stack.Screen>
            </Stack.Navigator>
          )}
        </NavigationContainer>
      </PaperProvider>
    );
  }
}
