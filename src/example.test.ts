import {
  Collection,
  Entity,
  LoadStrategy,
  ManyToOne,
  MikroORM,
  OneToMany,
  PrimaryKey,
  Property,
  Ref
} from '@mikro-orm/postgresql';

@Entity()
class User {
  @PrimaryKey()
  id!: number;

  @OneToMany(() => UserContact, (userContact) => userContact.user)
  contacts = new Collection<UserContact>(this);
}

@Entity()
class UserContact {
  @ManyToOne(() => User, { primary: true, strategy: LoadStrategy.JOINED, ref: true })
  user!: Ref<User>;

  @ManyToOne(() => Contact, { primary: true, strategy: LoadStrategy.JOINED, ref: true })
  contact!: Ref<Contact>;
}

@Entity()
class Contact {
  @PrimaryKey()
  id!: number;

  @Property()
  emails!: string[];

  @OneToMany(() => UserContact, (userContact) => userContact.contact)
  users = new Collection<UserContact>(this);
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    host: '',
    port: 0,
    user: '',
    password: '',
    dbName: '',
    schema: '',
    entities: [User],
    debug: ['query', 'query-params'],
    allowGlobalContext: true // only for testing
  });
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

test('basic CRUD example', async () => {
  const user = orm.em.create(User, {
    contacts: [
      {
        contact: {
          emails: ['foo']
        }
      }
    ]
  });
  await orm.em.flush();
  orm.em.clear();

  await orm.em.transactional(async (tx) => {
    await tx.findOneOrFail(User, user.id, { populate: ['contacts.contact'] });

    orm.em.getUnitOfWork().computeChangeSets();
    expect(orm.em.getUnitOfWork().getChangeSets().length).toBe(0);

    // alternatively, remove the stuff with changesets and just look at the log - there will be an 'update'
  });
});
