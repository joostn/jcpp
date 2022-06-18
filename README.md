# Joost's C++ utilities

Just a few simple transformations to speed up coding in c++.

Given a set of property declarations, eg:

```
class T
{
private:
    size_t m_Size;
    std::array<std::string,3> m_TheStrings;
};
```

Select the two lines containing the properties m_Size and m_TheStrings and run the commands:
## create getters and setters
Outputs the following:
```
const size_t& Size() const { return m_Size; }
void SetSize(const size_t& v) { m_Size = v; }
void SetSize(size_t&& v) { m_Size = std::move(v); }
const std::array<std::string,3>& TheStrings() const { return m_TheStrings; }
void SetTheStrings(const std::array<std::string,3>& v) { m_TheStrings = v; }
void SetTheStrings(std::array<std::string,3>&& v) { m_TheStrings = std::move(v); }
```

## create constructor
Outputs the following:
```
CONSTRUCTORNAME(const size_t& size, const std::array<std::string,3>& theStrings) : m_Size(size), m_TheStrings(theStrings) {}
```
## create property list
Outputs the following:
```
m_Size, m_TheStrings
```
