import config from "../config";
import { USER_ROLE } from "../modules/user/user.constant";
import { User } from "../modules/user/user.model";

const superAdmin = {
  name: "Sajjad Hossain",
  email: config.admin.superAdminEmail,
  password: config.admin.superAdminPassword,
  role: USER_ROLE.superAdmin,
  isDeleted: false,
  cartData: [],
};

// automatc added that
const seedSuperAdmin = async () => {
  // when database is connected will check is here any user who is super admin

  const isSuperAdminExist = await User.findOne({ role: USER_ROLE.superAdmin });

  if (!isSuperAdminExist) {
    await User.create(superAdmin);
  }
};

export default seedSuperAdmin;
