use bincode::{deserialize, serialize};
use rand::distributions::Alphanumeric;
use rand::Rng;
use serde::de::DeserializeOwned;
use serde::Serialize;

/// Length of the random hash created by the `new_id` method
const ID_LEN: usize = 16;

/// A record represents an entity stored into the tree
pub trait Record {
    /// Retrieves the Record's ID
    fn get_id(&self) -> String;
    /// Sets the Record's ID
    fn set_id(&mut self, id: &str);
}

pub trait Repository<const TREE: char, T: DeserializeOwned + Record + Serialize + Send> {
    type Error;

    /// Retrieves a tree fromt the Sled instance
    fn get_tree(&self) -> sled::Result<sled::Tree>;

    /// Generates a new random ID to use for storing new records into a tree
    fn new_id(&self) -> String {
        let id = rand::thread_rng()
            .sample_iter(&Alphanumeric)
            .take(ID_LEN)
            .map(char::from)
            .collect::<String>();

        format!("{TREE}_{id}")
    }

    /// Inserts a new Record into the tree by creating an instance of the
    /// record from a DTO
    fn create<U>(&self, dto: U) -> Result<T, Self::Error>
    where
        U: Into<T> + Send + Serialize,
    {
        let tree = self.get_tree().unwrap();
        let id = self.new_id();
        let mut record: T = dto.into();

        record.set_id(&id);
        let encoded = serialize(&record).unwrap();

        tree.insert(id, encoded).unwrap();

        Ok(record)
    }

    /// Fetches a record from the tree by its ID
    fn find_by_id(&self, id: String) -> Result<Option<T>, Self::Error> {
        let tree = self.get_tree().unwrap();
        let maybe_encoded_record = tree.get(id.as_bytes()).unwrap();

        if let Some(encoded_record) = maybe_encoded_record {
            let record: T = deserialize(&encoded_record).unwrap();

            return Ok(Some(record));
        }

        Ok(None)
    }

    /// Retrieves every record from the tree
    fn list(&self) -> Result<Vec<T>, Self::Error> {
        let tree = self.get_tree().unwrap();

        tree.iter()
            .map(|item| {
                let (_, encoded_record) = item.unwrap();
                Ok(bincode::deserialize::<T>(&encoded_record).unwrap())
            })
            .collect()
    }
}